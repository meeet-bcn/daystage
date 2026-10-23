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

/**
 * Una ticketera. `fetchEvents` devuelve conciertos de Barcelona ya
 * convertidos al modelo de MEEET, con una sola oferta (la suya) en `offers`.
 * La fusión de duplicados entre fuentes se hace después, en `merge.ts`.
 */
export type EventProvider = {
  source: TicketSource;
  fetchEvents: () => Promise<Concert[]>;
};
