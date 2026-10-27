// Qué enlace de compra se muestra cuando un concierto está en varias fuentes.

import type { TicketOffer } from '@/data/concerts';
import type { TicketSource } from '@/data/sources/types';

// Orden de preferencia: Ticketmaster primero; la agenda BCN, que no vende
// (enlaza a la web de la sala), solo si no hay ninguna ticketera
const PRIORITY: TicketSource[] = ['ticketmaster', 'fever', 'dice', 'entradas', 'theproject', 'bcn', 'user'];
const rank = (o: TicketOffer) => PRIORITY.indexOf(o.source);

/** Fuentes del concierto en orden (para las pastillas de la foto). */
export function sortedOffers(offers: TicketOffer[]) {
  return [...offers].sort((a, b) => rank(a) - rank(b));
}

/**
 * El único enlace de compra: el de Ticketmaster si está; si no, el de otra
 * ticketera; la agenda BCN solo cuando no hay ninguna. Las que no tienen
 * enlace, las últimas.
 */
export function buyOffer(offers: TicketOffer[]): TicketOffer {
  const sorted = sortedOffers(offers);
  return sorted.find((o) => o.url) ?? sorted[0];
}
