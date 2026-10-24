// Fuente "bcn": conciertos de la Agenda Cultural del Ayuntamiento de Barcelona
// (Open Data BCN, CC BY 4.0). No es una ticketera: es la agenda de la ciudad,
// con salas grandes, pequeñas, centros cívicos y conciertos gratuitos.
//
// La app no lee el archivo original (~170 MB): lee el que genera a diario
// scripts/build-bcn-agenda.mjs, ya filtrado (~650 KB), y que un Mac sube cada
// mañana a la rama gh-pages, servida por GitHub Pages (FEED_URL). Para probar cambios en la conversión sin
// publicarlos: EXPO_PUBLIC_BCN_AGENDA_URL=local en .env.local y
// `npm run feed:build && npm run feed:serve` (el Mac lo sirve en el puerto 8099).
// Si el archivo no llega, la fuente falla sola y la app sigue con Ticketmaster.

import { NativeModules } from 'react-native';

import type { BcnConcert, BcnFeed } from '@/data/bcn-agenda';
import type { Concert } from '@/data/concerts';
import { formatDate, formatPriceRange, toTimestamp } from '@/data/format';
import type { EventPage, EventProvider, EventQuery } from '@/data/sources/types';
import { foldText } from '@/data/text';

const FEED_URL = 'https://meeet-bcn.github.io/meeet/bcn-concerts.json';
const FEED_PORT = 8099;
const REFRESH_MS = 60 * 60 * 1000; // el archivo cambia una vez al día: basta con pedirlo cada hora

function feedUrl() {
  const configured = process.env.EXPO_PUBLIC_BCN_AGENDA_URL;
  if (configured !== 'local') return configured || FEED_URL;
  // "local": el Mac que sirve Metro, de donde viene el bundle
  // ("http://192.168.1.241:8081/…" en el móvil, "http://localhost:8081/…" en el
  // simulador). Constants.expoConfig.hostUri llega vacío en el build de desarrollo
  const source = NativeModules.SourceCode;
  const scriptURL: string | undefined = source?.getConstants?.().scriptURL ?? source?.scriptURL;
  const host = scriptURL?.match(/^https?:\/\/([^:/]+)/)?.[1];
  return host ? `http://${host}:${FEED_PORT}/bcn-concerts.json` : null;
}

let cache: { at: number; concerts: Concert[] } | null = null;

async function loadFeed(): Promise<Concert[]> {
  if (cache && Date.now() - cache.at < REFRESH_MS) return cache.concerts;
  const url = feedUrl();
  if (!url) return [];
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Agenda BCN respondió ${response.status}`);
  const feed: BcnFeed = await response.json();
  const concerts = feed.concerts.map(toConcert);
  cache = { at: Date.now(), concerts };
  return concerts;
}

export function toConcert(c: BcnConcert): Concert {
  const price = c.free ? 'Gratis' : c.priceMin != null ? formatPriceRange(c.priceMin, null) : '';
  return {
    id: c.id,
    artist: c.artist,
    venue: c.venue,
    date: formatDate(c.date, c.time || undefined),
    startsAt: toTimestamp(c.date, c.time || undefined),
    going: 0,
    offers: [{ source: 'bcn', url: c.url, price, priceMin: c.free ? 0 : c.priceMin }],
    image: c.image,
    hero: c.image,
    address: c.address,
    latitude: c.latitude,
    longitude: c.longitude,
    seatmap: '',
    info: c.info,
    doors: '',
    support: '',
    ages: '',
    price,
    priceMin: c.free ? 0 : c.priceMin,
    genre: c.genre,
    status: '',
  };
}

/**
 * El archivo es pequeño y llega entero: todo en la primera página. Con
 * `keyword`, los que coinciden (artista, sala o género, sin acentos).
 */
async function fetchEvents({ page, keyword }: EventQuery): Promise<EventPage> {
  if (page > 0) return { concerts: [], hasMore: false };
  const concerts = await loadFeed();
  if (!keyword) return { concerts, hasMore: false };
  const words = foldText(keyword).split(/\s+/).filter(Boolean);
  const matches = concerts.filter((c) => {
    const text = foldText(`${c.artist} ${c.venue} ${c.genre}`);
    return words.every((w) => text.includes(w));
  });
  return { concerts: matches, hasMore: false };
}

export const bcn: EventProvider = { source: 'bcn', fetchEvents };
