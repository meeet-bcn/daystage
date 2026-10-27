import type { Concert } from '@/data/concerts';

export type TicketSource =
  | 'ticketmaster'
  | 'bcn' // Agenda Cultural del Ayuntamiento: no es ticketera, pero trae la web de entradas
  | 'fever'
  | 'dice'
  | 'entradas'
  | 'theproject'
  | 'user'; // Eventos propios: los añade la gente en la app (user_events)

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
