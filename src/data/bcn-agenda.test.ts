import { describe, expect, it } from '@jest/globals';

import * as raw from '@/data/__fixtures__/bcn-agenda';
import {
  BCN_ATTRIBUTION,
  buildFeed,
  cleanConcertName,
  htmlToText,
  isConcert,
  parseTimetable,
  toBcnConcert,
} from '@/data/bcn-agenda';

describe('isConcert', () => {
  it('solo la tipología "Concerts", aunque el nombre diga concierto', () => {
    expect(isConcert(raw.loveless)).toBe(true);
    expect(isConcert(raw.rosenwinkel)).toBe(true);
    expect(isConcert(raw.notConcert)).toBe(false);
  });

  it('fuera las fiestas, ferias y talleres que también llevan "Concerts"', () => {
    const fair = {
      ...raw.loveless,
      classifications_data: [
        { name: 'Concerts', full_path: 'Tipologia AG >> Concerts' },
        { name: 'Mostres, fires i salons', full_path: 'Tipologia AG >> Mostres, fires i salons' },
      ],
    };
    const show = {
      ...raw.loveless,
      classifications_data: [
        { name: 'Concerts', full_path: 'Tipologia AG >> Concerts' },
        { name: 'Espectacles', full_path: 'Tipologia AG >> Espectacles' },
      ],
    };
    expect(isConcert(fair)).toBe(false);
    expect(isConcert(show)).toBe(true);
  });
});

describe('parseTimetable', () => {
  it('hora, precio y gratuidad de los horarios reales', () => {
    expect(parseTimetable(raw.rosenwinkel.timetable?.html ?? '')).toEqual({
      time: '20:30:00',
      priceMin: 38,
      free: false,
    });
    expect(parseTimetable(raw.free.timetable?.html ?? '')).toMatchObject({
      time: '21:00:00',
      priceMin: 0,
      free: true,
    });
  });

  it('«de 21.00 h a 00.00 h» toma la de inicio; sin horario, vacío', () => {
    expect(parseTimetable('<td>de 21.00 h a 00.00 h</td>').time).toBe('21:00:00');
    expect(parseTimetable('<td>a les 9.30 h</td>').time).toBe('09:30:00');
    expect(parseTimetable('')).toEqual({ time: '', priceMin: null, free: false });
  });

  it('con varios precios, el más barato', () => {
    expect(parseTimetable('General: 25 € · Reduïda: 18,5 €').priceMin).toBe(18.5);
  });
});

describe('cleanConcertName', () => {
  it.each([
    ['Concert "Kurt Rosenwinkel"', 'Kurt Rosenwinkel'],
    ["Concert 'Sara Roy'", 'Sara Roy'],
    ['Concerts: “Quartets de corda”', 'Quartets de corda'],
    ['Concert "Canta Sinatra", amb Bresca', 'Canta Sinatra, amb Bresca'],
    ['Concerts de "Ensemble Jaume Padròs"', 'Ensemble Jaume Padròs'],
    ['Festival de shoegaze "Loveless"', 'Festival de shoegaze "Loveless"'],
    ['  Jam   sessions al Coll ', 'Jam sessions al Coll'],
  ])('%s → %s', (input, expected) => {
    expect(cleanConcertName(input)).toBe(expected);
  });
});

describe('htmlToText', () => {
  it('quita etiquetas y entidades, un párrafo por línea', () => {
    expect(htmlToText('<p>Hola&nbsp;<b>Barcelona</b></p><ul><li>Uno</li><li>Dos</li></ul>')).toBe(
      'Hola Barcelona\nUno\nDos'
    );
  });
});

describe('toBcnConcert', () => {
  it('convierte un concierto real con sala, dirección, coordenadas, imagen y web', () => {
    const concert = toBcnConcert(raw.loveless);
    expect(concert).toMatchObject({
      id: `bcn-${raw.loveless.register_id}`,
      artist: 'Festival de shoegaze "Loveless"',
      date: '2026-10-24',
      venue: 'Sala Upload · Poble Espanyol',
      latitude: 41.36914809976752,
      longitude: 2.1467430809493484,
      genre: 'Electrónica',
      url: 'https://sala-upload.com/ca/conciertos/loveless-shoegaze-festival/',
    });
    expect(concert?.address).toContain('08038 Barcelona');
    expect(concert?.image).toMatch(/^https:\/\//);
  });

  it('la fecha trae una hora de relleno: la de verdad sale del horario', () => {
    const concert = toBcnConcert(raw.rosenwinkel);
    expect(concert).toMatchObject({
      artist: 'Kurt Rosenwinkel',
      date: '2026-11-05',
      time: '20:30:00',
    });
  });
});

describe('buildFeed', () => {
  const all = Object.values(raw);

  it('solo conciertos de un día desde hoy, por fecha, con la atribución', () => {
    const feed = buildFeed(all, '2026-10-24', '2026-10-24T06:00:00Z');
    expect(feed.attribution).toBe(BCN_ATTRIBUTION);
    expect(feed.concerts.map((c) => c.artist)).toEqual([
      'Festival de shoegaze "Loveless"',
      'Kurt Rosenwinkel',
      'The Middle Way',
    ]);
  });

  it('deja fuera los que ya han pasado', () => {
    const feed = buildFeed(all, '2026-11-06', '2026-11-06T06:00:00Z');
    expect(feed.concerts.map((c) => c.artist)).toEqual(['The Middle Way']);
  });
});
