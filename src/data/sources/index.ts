import { ticketmaster } from '@/data/sources/ticketmaster';
import type { EventProvider } from '@/data/sources/types';

/**
 * Ticketeras activas, por orden de prioridad: cuando un concierto está en
 * varias, los datos (imagen, reseña...) se toman primero de la que va antes.
 *
 * Para añadir una nueva (Fever, DICE, Entradas.com, The Project...):
 * 1. Crea `sources/<nombre>.ts` exportando un `EventProvider`, siguiendo
 *    `ticketmaster.ts`: ids con prefijo `<source>-` y una oferta en `offers`.
 * 2. Añádela a esta lista.
 * Las claves de socio NO pueden ir en la app (EXPO_PUBLIC_ se incrusta en el
 * bundle): esas fuentes deben llamar a nuestro backend, no a la ticketera.
 */
export const PROVIDERS: EventProvider[] = [ticketmaster];
