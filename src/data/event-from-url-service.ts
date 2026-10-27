// Leer la web de un evento para rellenar «Añadir concierto» (event-from-url.ts
// hace el análisis). Un enlace de Ticketmaster se pide a su API: ese concierto
// ya existe en la app, así que se abre en vez de duplicarlo.

import type { Concert } from '@/data/concerts';
import { normalizeUrl, type PageInfo, parseEventPage, ticketmasterLink } from '@/data/event-from-url';
import { fetchTicketmasterByWebUrl } from '@/data/sources/ticketmaster';

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2_000_000;
// Algunas webs solo dan la página completa a un navegador
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

export type UrlResult =
  | { kind: 'page'; url: string; info: PageInfo }
  | { kind: 'existing'; concert: Concert }
  | { kind: 'error'; message: string };

const NOT_READABLE = 'No hemos podido leer esa página. Rellena los datos a mano.';

/** `concerts`: lo cargado, para ver si el enlace es de un concierto que ya está. */
export async function readEventUrl(text: string, concerts: Concert[]): Promise<UrlResult> {
  const url = normalizeUrl(text);
  if (!url) return { kind: 'error', message: 'Eso no parece un enlace. Cópialo entero de la web.' };

  // ¿Es la web de entradas de un concierto que ya está en la app?
  const same = concerts.find((c) => c.offers.some((o) => o.url && o.url.split('?')[0] === url.split('?')[0]));
  if (same) return { kind: 'existing', concert: same };

  // Ticketmaster no deja leer su web (bloquea), pero su API sí tiene el evento
  const tm = ticketmasterLink(url);
  if (tm) {
    const concert = await fetchTicketmasterByWebUrl(tm.webId, tm.keyword).catch(() => null);
    if (concert) return { kind: 'existing', concert };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) return { kind: 'error', message: NOT_READABLE };
    const html = (await response.text()).slice(0, MAX_BYTES);
    const info = parseEventPage(html, response.url || url);
    if (info.found.length <= 1) return { kind: 'error', message: NOT_READABLE };
    return { kind: 'page', url, info };
  } catch {
    return { kind: 'error', message: NOT_READABLE };
  } finally {
    clearTimeout(timer);
  }
}
