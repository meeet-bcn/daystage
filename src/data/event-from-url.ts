// Rellenar un evento propio desde su página web (funciones puras): casi todas
// las webs de entradas publican el evento en JSON-LD (schema.org Event /
// MusicEvent) para Google; si no, se usan las etiquetas Open Graph (og:title,
// og:image, og:description). El HTML lo baja event-form con fetch.

import type { EventDraft } from '@/data/user-events';

/** Lo que se ha podido sacar de la página: campos del borrador, la foto (URL), dónde está y qué falta. */
export type PageInfo = {
  draft: Partial<EventDraft>;
  imageUrl: string | null;
  coords: { latitude: number; longitude: number } | null;
  found: (keyof EventDraft)[];
  /** Lo imprescindible que la página no trae (para marcarlo en el formulario). */
  missing: (keyof EventDraft)[];
};

/** Lo imprescindible de una ficha (sin la visibilidad, que elige quien lo añade). */
export const REQUIRED_FIELDS: (keyof EventDraft)[] = ['title', 'date', 'startTime', 'venue', 'city'];

type Json = Record<string, unknown>;

const EVENT_TYPES = /(^|\b)(Event|MusicEvent|Festival|TheaterEvent|ComedyEvent|DanceEvent|SocialEvent)$/;

const pad = (n: number) => String(n).padStart(2, '0');

/** Entidades HTML básicas (&amp; &quot; &#39; &#x27; …) y etiquetas fuera. */
export function cleanText(text: string) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Todos los objetos de los bloques JSON-LD (también dentro de @graph y listas). */
function jsonLdObjects(html: string): Json[] {
  const out: Json[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const walk = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') {
      const obj = value as Json;
      out.push(obj);
      if (Array.isArray(obj['@graph'])) (obj['@graph'] as unknown[]).forEach(walk);
    }
  };
  for (const m of html.matchAll(re)) {
    try {
      walk(JSON.parse(m[1].trim()));
    } catch {
      // Un bloque mal formado no impide leer los demás
    }
  }
  return out;
}

const isEvent = (o: Json) => {
  const t = o['@type'];
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => typeof x === 'string' && EVENT_TYPES.test(x));
};

const str = (v: unknown) => (typeof v === 'string' ? cleanText(v) : '');

function firstImage(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return firstImage(v[0]);
  if (v && typeof v === 'object') return str((v as Json).url) || str((v as Json).contentUrl) || null;
  return null;
}

/** "2026-11-14T21:30:00+01:00" → fecha y hora locales; "2026-11-14" → solo la fecha. */
export function splitDateTime(value: string): { date: string; time: string } | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: value, time: '' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function fromEvent(e: Json, pageUrl: string): PageInfo {
  const draft: Partial<EventDraft> = {};
  const performer = Array.isArray(e.performer) ? e.performer[0] : e.performer;
  draft.title = str(e.name) || str((performer as Json | undefined)?.name);

  const start = splitDateTime(str(e.startDate));
  if (start) {
    draft.date = start.date;
    if (start.time) draft.startTime = start.time;
  }
  const end = splitDateTime(str(e.endDate));
  // Solo la hora de fin si es el mismo día o la madrugada siguiente
  if (end?.time && start && end.time !== draft.startTime) {
    const days = (Date.parse(end.date) - Date.parse(start.date)) / 86_400_000;
    if (days === 0 || days === 1) draft.endTime = end.time;
  }

  const location = (Array.isArray(e.location) ? e.location[0] : e.location) as Json | string | undefined;
  let coords: PageInfo['coords'] = null;
  if (typeof location === 'string') draft.venue = cleanText(location);
  else if (location) {
    const geo = location.geo as Json | undefined;
    const lat = Number(geo?.latitude);
    const lng = Number(geo?.longitude);
    if (geo && Number.isFinite(lat) && Number.isFinite(lng)) coords = { latitude: lat, longitude: lng };
    draft.venue = str(location.name);
    const address = location.address as Json | string | undefined;
    if (typeof address === 'string') draft.address = cleanText(address);
    else if (address) {
      draft.address = str(address.streetAddress);
      const city = str(address.addressLocality);
      if (city) draft.city = city;
    }
  }

  const offers = (Array.isArray(e.offers) ? e.offers : [e.offers]).filter(Boolean) as Json[];
  const prices = offers
    .map((o) => Number(String(o.price ?? o.lowPrice ?? '').replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n >= 0);
  if (prices.length > 0) {
    const min = Math.min(...prices);
    draft.priceKind = min === 0 ? 'free' : 'from';
    if (min > 0) draft.price = String(min).replace('.', ',');
  } else if (e.isAccessibleForFree === true) {
    draft.priceKind = 'free';
  }
  const offerUrl = offers.map((o) => str(o.url)).find((u) => /^https?:\/\//.test(u));
  draft.ticketUrl = offerUrl || pageUrl;

  const description = str(e.description);
  if (description) draft.description = description.slice(0, 2000);

  return finish(draft, firstImage(e.image), coords);
}

function meta(html: string, name: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
    'i'
  );
  const m = re.exec(html);
  return m ? cleanText(m[1] ?? m[2] ?? '') : '';
}

function finish(
  draft: Partial<EventDraft>,
  imageUrl: string | null,
  coords: PageInfo['coords'] = null
): PageInfo {
  const clean = Object.fromEntries(
    Object.entries(draft).filter(([, v]) => typeof v === 'string' && v !== '')
  ) as Partial<EventDraft>;
  const found = Object.keys(clean) as (keyof EventDraft)[];
  return {
    draft: clean,
    imageUrl: imageUrl || null,
    coords,
    found,
    missing: REQUIRED_FIELDS.filter((f) => !found.includes(f)),
  };
}

/** Lo que se pueda sacar de la página del evento (`pageUrl` sirve de enlace de entradas). */
export function parseEventPage(html: string, pageUrl: string): PageInfo {
  const event = jsonLdObjects(html).find(isEvent);
  if (event) return fromEvent(event, pageUrl);

  // Sin JSON-LD: Open Graph / Twitter (título, foto, descripción, hora) y el título de la página
  const title =
    meta(html, 'og:title') ||
    meta(html, 'twitter:title') ||
    cleanText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');
  const start = splitDateTime(meta(html, 'event:start_time'));
  return finish(
    {
      title: title.slice(0, 120),
      ...(start ? { date: start.date, ...(start.time ? { startTime: start.time } : {}) } : {}),
      description: (meta(html, 'og:description') || meta(html, 'description')).slice(0, 2000),
      ticketUrl: meta(html, 'og:url') || pageUrl,
    },
    meta(html, 'og:image') || meta(html, 'twitter:image') || null
  );
}

/** Normaliza lo que se pega: añade https:// si falta. null si no parece una web. */
export function normalizeUrl(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const url = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  return /^https?:\/\/[^\s/]+\.[^\s/]+/.test(url) ? url : null;
}

/**
 * Un enlace de la web de Ticketmaster (…/event/<nombre>/<id>): su id web y
 * palabras para buscarlo en la API ("oasis-live-27-tickets" → "oasis live 27").
 */
export function ticketmasterLink(url: string): { webId: string; keyword: string } | null {
  const m = /^https?:\/\/(?:www\.)?ticketmaster\.[a-z.]+\/(?:[^?#]*\/)?event\/(?:([^/?#]+)\/)?([A-Za-z0-9]{6,})(?:[/?#]|$)/i.exec(url);
  if (!m) return null;
  const words = decodeURIComponent(m[1] ?? '')
    .toLowerCase()
    .split(/[^a-z0-9áéíóúüñ]+/)
    .filter((w) => w && !['tickets', 'entradas', 'ticket', 'hotel', 'packages', 'package'].includes(w));
  return { webId: m[2], keyword: words.slice(0, 4).join(' ') };
}
