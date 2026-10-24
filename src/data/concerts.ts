import { PROVIDERS } from '@/data/sources';
import type { EventPage, EventQuery, TicketSource } from '@/data/sources/types';

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
 * Pide una página de conciertos a todas las ticketeras a la vez (sin fusionar:
 * eso se hace con todas las páginas juntas, `mergeConcerts`). Si alguna falla
 * se sigue con las demás; solo da error si fallan todas. Quedan más páginas
 * mientras alguna ticketera tenga más.
 */
/**
 * Una página de todas las fuentes y `until`: hasta qué fecha (ms) está todo
 * cargado. Es el último concierto de cada fuente a la que aún le quedan
 * páginas, el más temprano de ellos; null si ninguna tiene más. Así, una fuente
 * que llega entera (la agenda BCN) no adelanta a otra que llega por páginas.
 */
export type ConcertsPage = EventPage & { until: number | null };

export async function fetchConcerts(query: EventQuery): Promise<ConcertsPage> {
  const results = await Promise.allSettled(PROVIDERS.map((p) => p.fetchEvents(query)));

  const concerts: Concert[] = [];
  const errors: string[] = [];
  let hasMore = false;
  let until: number | null = null;
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      concerts.push(...result.value.concerts);
      hasMore ||= result.value.hasMore;
      if (result.value.hasMore) {
        const last = lastDate(result.value.concerts);
        if (last != null) until = until == null ? last : Math.min(until, last);
      }
    } else {
      const message =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push(message);
      console.warn(`[${PROVIDERS[i].source}] ${message}`);
    }
  });

  if (errors.length === PROVIDERS.length) throw new Error(errors[0]);

  return { concerts, hasMore, until };
}

/** Fecha del último concierto con fecha de la lista, o null. */
export function lastDate(concerts: Concert[]) {
  const dates = concerts.map((c) => c.startsAt).filter((t): t is number => t != null);
  return dates.length > 0 ? Math.max(...dates) : null;
}
