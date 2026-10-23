import type { Concert } from '@/data/concerts';
import type { TicketSource } from '@/data/sources/types';

/** Concierto mínimo para tests; `overrides` pisa cualquier campo. */
export function makeConcert(overrides: Partial<Concert> = {}): Concert {
  return {
    id: 'ticketmaster-1',
    artist: 'Artista',
    venue: 'Sala Apolo',
    date: '',
    startsAt: new Date(2026, 9, 24, 21, 0).getTime(),
    going: 0,
    offers: [{ source: 'ticketmaster', url: 'https://tm/1', price: '', priceMin: null }],
    image: '',
    hero: '',
    address: '',
    latitude: 41.374,
    longitude: 2.169,
    seatmap: '',
    info: '',
    doors: '',
    support: '',
    ages: '',
    price: '',
    priceMin: null,
    genre: '',
    status: '',
    ...overrides,
  };
}

/** El mismo concierto tal como llegaría desde otra ticketera. */
export function fromSource(
  concert: Concert,
  source: TicketSource,
  priceMin: number | null,
  overrides: Partial<Concert> = {}
): Concert {
  const price = priceMin != null ? `${priceMin} €` : '';
  return {
    ...concert,
    id: `${source}-${concert.id}`,
    offers: [{ source, url: `https://${source}/x`, price, priceMin }],
    price,
    priceMin,
    ...overrides,
  };
}
