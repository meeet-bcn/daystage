import { mergeConcerts } from '@/data/merge';
import { PROVIDERS } from '@/data/sources';
import type { TicketSource } from '@/data/sources/types';

/** Dónde comprar entradas para un concierto. */
export type TicketOffer = {
  source: TicketSource;
  url: string;
  price: string;
  priceMin: number | null;
};

export type Concert = {
  /** `<source>-<id de la ticketera>`, único entre fuentes. */
  id: string;
  artist: string;
  venue: string;
  date: string;
  startsAt: number | null; // timestamp en ms, para ordenar y filtrar
  going: number;
  /** Una por ticketera, la más barata primero. Nunca vacío. */
  offers: TicketOffer[];
  image: string;
  hero: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  seatmap: string;
  /** Reseña del concierto, ya sin letra pequeña de venta. */
  info: string;
  doors: string;
  support: string;
  ages: string;
  /** Precio a mostrar ("Desde 18 €" si hay varias ofertas). */
  price: string;
  /** El más barato de todas las ofertas. */
  priceMin: number | null;
  genre: string;
  status: string;
};

/**
 * Pide los conciertos a todas las ticketeras a la vez. Si alguna falla se
 * sigue con las demás; solo da error si fallan todas.
 */
export async function fetchConcerts(): Promise<Concert[]> {
  const results = await Promise.allSettled(PROVIDERS.map((p) => p.fetchEvents()));

  const concerts: Concert[] = [];
  const errors: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') concerts.push(...result.value);
    else {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push(message);
      console.warn(`[${PROVIDERS[i].source}] ${message}`);
    }
  });

  if (errors.length === PROVIDERS.length) throw new Error(errors[0]);

  return mergeConcerts(concerts);
}
