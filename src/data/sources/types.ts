import type { Concert } from '@/data/concerts';

export type TicketSource = 'ticketmaster' | 'fever' | 'dice' | 'entradas' | 'theproject';

/** Nombre visible de cada ticketera ("Comprar en ..."). */
export const SOURCE_NAMES: Record<TicketSource, string> = {
  ticketmaster: 'Ticketmaster',
  fever: 'Fever',
  dice: 'DICE',
  entradas: 'Entradas.com',
  theproject: 'The Project',
};

/** Qué página pedir (desde 0) y, si se busca, el texto de la búsqueda. */
export type EventQuery = { page: number; keyword?: string };

/** Una página de resultados y si quedan más. */
export type EventPage = { concerts: Concert[]; hasMore: boolean };

/**
 * Una ticketera. `fetchEvents` devuelve una página de conciertos de Barcelona,
 * por fecha, ya convertidos al modelo de MEEET y con una sola oferta (la suya)
 * en `offers`. La fusión de duplicados entre fuentes se hace después, en `merge.ts`.
 */
export type EventProvider = {
  source: TicketSource;
  fetchEvents: (query: EventQuery) => Promise<EventPage>;
};
