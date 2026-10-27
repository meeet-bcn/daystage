import { describe, expect, it } from '@jest/globals';

import { cleanText, normalizeUrl, parseEventPage, splitDateTime, ticketmasterLink } from '@/data/event-from-url';

// Páginas inventadas, con la forma de las webs de entradas reales
const URL = 'https://entradas.example.com/los-invento';

const jsonLd = (data: unknown) =>
  `<html><head><script type="application/ld+json">${JSON.stringify(data)}</script></head><body></body></html>`;

describe('parseEventPage · JSON-LD', () => {
  it('MusicEvent completo: nombre, fecha y hora, sala, dirección, ciudad, precio, foto y descripción', () => {
    const html = jsonLd({
      '@context': 'https://schema.org',
      '@type': 'MusicEvent',
      name: 'Los Invento &amp; amigos',
      startDate: '2026-11-14T21:30:00+01:00',
      endDate: '2026-11-15T00:30:00+01:00',
      location: {
        '@type': 'Place',
        name: 'Sala Ejemplo',
        address: { '@type': 'PostalAddress', streetAddress: 'C/ Inventada, 1', addressLocality: 'Barcelona' },
      },
      offers: [
        { '@type': 'Offer', price: '25', priceCurrency: 'EUR', url: 'https://entradas.example.com/comprar' },
        { '@type': 'Offer', price: '18.5', priceCurrency: 'EUR' },
      ],
      image: ['https://img.example.com/cartel.jpg'],
      description: '<p>Gira de presentación del nuevo disco.</p>',
    });
    const { draft, imageUrl, found } = parseEventPage(html, URL);
    expect(draft).toEqual({
      title: 'Los Invento & amigos',
      date: '2026-11-14',
      startTime: '21:30',
      endTime: '00:30',
      venue: 'Sala Ejemplo',
      address: 'C/ Inventada, 1',
      city: 'Barcelona',
      priceKind: 'from',
      price: '18,5',
      ticketUrl: 'https://entradas.example.com/comprar',
      description: 'Gira de presentación del nuevo disco.',
    });
    expect(imageUrl).toBe('https://img.example.com/cartel.jpg');
    expect(found).toContain('venue');
  });

  it('coordenadas del lugar y lo imprescindible que falta', () => {
    const html = jsonLd({
      '@type': 'Event',
      name: 'Sin fecha',
      location: { name: 'Sala', geo: { latitude: '41.39', longitude: 2.17 } },
    });
    const info = parseEventPage(html, URL);
    expect(info.coords).toEqual({ latitude: 41.39, longitude: 2.17 });
    expect(info.missing).toEqual(['date', 'startTime', 'city']);
  });

  it('dentro de @graph, gratis, lugar como texto y sin hora', () => {
    const html = jsonLd({
      '@graph': [
        { '@type': 'WebPage', name: 'Agenda' },
        { '@type': ['Event'], name: 'Concierto en la plaza', startDate: '2026-12-01', location: 'Plaça Inventada', isAccessibleForFree: true, image: { url: 'https://img.example.com/p.png' } },
      ],
    });
    const { draft, imageUrl } = parseEventPage(html, URL);
    expect(draft).toMatchObject({ title: 'Concierto en la plaza', date: '2026-12-01', venue: 'Plaça Inventada', priceKind: 'free', ticketUrl: URL });
    expect(draft.startTime).toBeUndefined();
    expect(imageUrl).toBe('https://img.example.com/p.png');
  });

  it('el nombre del artista si el evento no lo tiene, y un bloque roto no estropea los demás', () => {
    const html =
      '<script type="application/ld+json">{ roto </script>' +
      jsonLd({ '@type': 'MusicEvent', performer: [{ name: 'Banda Inventada' }], startDate: '2026-11-20T20:00:00Z' });
    const { draft } = parseEventPage(html, URL);
    expect(draft.title).toBe('Banda Inventada');
    expect(draft.startTime).toBe('21:00'); // 20:00 UTC en Madrid
  });
});

describe('parseEventPage · Open Graph', () => {
  it('sin JSON-LD: título, foto y descripción de las etiquetas', () => {
    const html = `<html><head><title>Otra cosa</title>
      <meta property="og:title" content="Los Invento en Barcelona">
      <meta content="https://img.example.com/og.jpg" property="og:image">
      <meta name="description" content="Una noche inventada"></head></html>`;
    const { draft, imageUrl } = parseEventPage(html, URL);
    expect(draft).toEqual({ title: 'Los Invento en Barcelona', description: 'Una noche inventada', ticketUrl: URL });
    expect(imageUrl).toBe('https://img.example.com/og.jpg');
  });

  it('Twitter y event:start_time si no hay Open Graph de título', () => {
    const html = `<meta name="twitter:title" content="Banda X"><meta property="event:start_time" content="2026-11-20T21:00:00+01:00"><meta name="twitter:image" content="https://img.example.com/t.jpg"><meta property="og:url" content="https://example.com/canon">`;
    const { draft, imageUrl, missing } = parseEventPage(html, URL);
    expect(draft).toMatchObject({ title: 'Banda X', date: '2026-11-20', startTime: '21:00', ticketUrl: 'https://example.com/canon' });
    expect(imageUrl).toBe('https://img.example.com/t.jpg');
    expect(missing).toEqual(['venue', 'city']);
  });

  it('una página sin nada útil: solo el título y el enlace', () => {
    const { draft, imageUrl } = parseEventPage('<html><title>Hola</title></html>', URL);
    expect(draft).toEqual({ title: 'Hola', ticketUrl: URL });
    expect(imageUrl).toBeNull();
  });
});

describe('utilidades', () => {
  it('splitDateTime', () => {
    expect(splitDateTime('2026-11-14')).toEqual({ date: '2026-11-14', time: '' });
    expect(splitDateTime('2026-11-14T21:30:00+01:00')).toEqual({ date: '2026-11-14', time: '21:30' });
    expect(splitDateTime('mañana')).toBeNull();
  });

  it('cleanText', () => {
    expect(cleanText('<b>Rock&nbsp;&amp;&#32;roll</b> &#x27;80')).toBe("Rock & roll '80");
  });

  it('ticketmasterLink', () => {
    expect(ticketmasterLink('https://www.ticketmaster.es/event/los-invento-gira-2026-entradas/123456789')).toEqual({
      webId: '123456789',
      keyword: 'los invento gira 2026',
    });
    expect(ticketmasterLink('https://www.ticketmaster.es/event/banda-x-%7C-ticket--hotel-packages-tickets/104?x')).toBeNull();
    expect(ticketmasterLink('https://www.ticketmaster.es/event/banda-x-%7C-ticket--hotel-packages-tickets/1040000')?.keyword).toBe('banda x');
    expect(ticketmasterLink('https://www.ticketmaster.es/artist/123456')).toBeNull();
    expect(ticketmasterLink('https://entradas.example.com/event/x/123456')).toBeNull();
  });

  it('normalizeUrl', () => {
    expect(normalizeUrl('entradas.example.com/x')).toBe('https://entradas.example.com/x');
    expect(normalizeUrl(' https://a.b/c ')).toBe('https://a.b/c');
    expect(normalizeUrl('hola')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });
});
