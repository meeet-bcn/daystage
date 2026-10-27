// Información de artistas desde MusicBrainz (https://musicbrainz.org/doc/MusicBrainz_API).
//
// Reglas de la API: máximo 1 petición por segundo por IP y un User-Agent con
// contacto. Uso no comercial gratuito; para una app pública hace falta un plan
// comercial de MetaBrainz (ver CLAUDE.md). Datos bajo licencia CC0.

import Constants from 'expo-constants';

import { compactText, foldText, headlinerName } from '@/data/text';

export type ArtistLinkKind =
  | 'spotify'
  | 'apple'
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'bandcamp'
  | 'soundcloud'
  | 'web';

export type ArtistLink = { kind: ArtistLinkKind; url: string };

export type ArtistInfo = {
  mbid: string;
  name: string;
  /** "Grupo", "Solista"... o '' si no se sabe. */
  type: string;
  /** País en español ("Irlanda"), o '' si no se sabe. */
  country: string;
  /** Año de formación de un grupo ("2014"), o ''. En solistas sería el nacimiento: no se usa. */
  since: string;
  /** Los géneros más votados, como mucho 4. */
  genres: string[];
  /** Un enlace por tipo, en el orden de ARTIST_LINK_KINDS. */
  links: ArtistLink[];
};

/** Orden en que se muestran los enlaces. */
export const ARTIST_LINK_KINDS: ArtistLinkKind[] = [
  'spotify',
  'apple',
  'youtube',
  'instagram',
  'tiktok',
  'bandcamp',
  'soundcloud',
  'web',
];

const TYPE_LABELS: Record<string, string> = {
  Group: 'Grupo',
  Person: 'Solista',
  Orchestra: 'Orquesta',
  Choir: 'Coro',
};

// Para el desempate por género: "Hip-Hop/Rap" → ["hip", "hop", "rap"]
function genreWords(text: string) {
  return foldText(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);
}

type SearchCandidate = {
  id: string;
  name: string;
  score: number;
  disambiguation?: string;
  tags?: { name: string }[];
};

/**
 * Elige el artista de una búsqueda solo si no hay dudas: nombre idéntico y,
 * si hay homónimos, una puntuación claramente mayor o un único candidato
 * cuyo estilo encaje con el género del concierto. Si no, `null`: mejor no
 * mostrar nada que mostrar a otro artista.
 */
export function pickArtist(
  search: { artists?: SearchCandidate[] },
  wantedName: string,
  concertGenre = ''
): SearchCandidate | null {
  // "Chameleons" y "The Chameleons" son el mismo nombre
  const comparable = (s: string) => compactText(s.replace(/^the\s+/i, ''));
  const wanted = comparable(wantedName);
  const exact = (search.artists ?? [])
    .filter((a) => comparable(a.name) === wanted)
    .sort((a, b) => b.score - a.score);

  if (exact.length === 0) return null;
  if (exact.length === 1) return exact[0].score >= 80 ? exact[0] : null;
  if (exact[0].score - exact[1].score >= 15) return exact[0];

  const words = genreWords(concertGenre);
  if (words.length === 0) return null;
  const fitting = exact.filter((a) => {
    const style = genreWords([a.disambiguation ?? '', ...(a.tags ?? []).map((t) => t.name)].join(' '));
    return words.some((w) => style.includes(w));
  });
  return fitting.length === 1 ? fitting[0] : null;
}

export function linkKind(url: string): ArtistLinkKind | null {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  if (host === 'open.spotify.com') return 'spotify';
  if (host === 'music.apple.com' || host === 'itunes.apple.com') return 'apple';
  if (host === 'youtube.com' || host === 'm.youtube.com') return 'youtube';
  if (host === 'instagram.com') return 'instagram';
  if (host === 'tiktok.com') return 'tiktok';
  if (host.endsWith('bandcamp.com')) return 'bandcamp';
  if (host === 'soundcloud.com') return 'soundcloud';
  return null;
}

function countryName(code?: string, fallback = '') {
  if (!code) return fallback;
  try {
    return new Intl.DisplayNames(['es'], { type: 'region' }).of(code) ?? fallback;
  } catch {
    return fallback; // Motores sin Intl.DisplayNames
  }
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type LookupResponse = {
  id: string;
  name: string;
  type?: string | null;
  country?: string | null;
  area?: { name?: string } | null;
  'life-span'?: { begin?: string | null } | null;
  genres?: { name: string; count: number }[];
  relations?: { type: string; url?: { resource: string } }[];
};

export function parseArtist(data: LookupResponse): ArtistInfo {
  const found = new Map<ArtistLinkKind, string>();
  for (const rel of data.relations ?? []) {
    const url = rel.url?.resource;
    if (!url) continue;
    const kind = rel.type === 'official homepage' ? 'web' : linkKind(url);
    if (kind && !found.has(kind)) found.set(kind, url);
  }

  return {
    mbid: data.id,
    name: data.name,
    type: TYPE_LABELS[data.type ?? ''] ?? '',
    country: countryName(data.country ?? undefined, data.area?.name ?? ''),
    since: data.type === 'Person' ? '' : (data['life-span']?.begin?.slice(0, 4) ?? ''),
    genres: [...(data.genres ?? [])]
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((g) => capitalize(g.name)),
    links: ARTIST_LINK_KINDS.filter((k) => found.has(k)).map((kind) => ({
      kind,
      url: found.get(kind)!,
    })),
  };
}

// --- Red -------------------------------------------------------------------

const API = 'https://musicbrainz.org/ws/2';
const MIN_INTERVAL_MS = 1100; // algo por encima de 1 petición/s
const RETRY_AFTER_MS = 2500;
const CONTACT = process.env.EXPO_PUBLIC_MUSICBRAINZ_CONTACT;
const USER_AGENT = `DayStage/${Constants.expoConfig?.version ?? '0'}${CONTACT ? ` ( ${CONTACT} )` : ''}`;

let queue: Promise<unknown> = Promise.resolve();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Las peticiones salen en fila, separadas por MIN_INTERVAL_MS. Un 503 es
 * "vas demasiado rápido": se reintenta una vez tras una pausa.
 */
function throttledGet<T>(path: string): Promise<T> {
  const get = () =>
    fetch(`${API}${path}`, { headers: { Accept: 'application/json', 'User-Agent': USER_AGENT } });

  const request = queue.then(async () => {
    let response = await get();
    if (response.status === 503) {
      await wait(RETRY_AFTER_MS);
      response = await get();
    }
    if (!response.ok) throw new Error(`MusicBrainz ${response.status}`);
    return (await response.json()) as T;
  });
  queue = request.catch(() => undefined).then(() => wait(MIN_INTERVAL_MS));
  return request;
}

// Escapa la sintaxis de búsqueda de Lucene
const escapeQuery = (s: string) => s.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, '\\$&');

const cache = new Map<string, Promise<ArtistInfo | null>>();

/**
 * Info del artista principal de un concierto, o `null` si no se encuentra
 * con seguridad. Cachea por artista; los errores de red no se cachean.
 */
export function fetchArtistInfo(eventName: string, genre = ''): Promise<ArtistInfo | null> {
  const name = headlinerName(eventName);
  const key = compactText(name);
  if (!key) return Promise.resolve(null);

  const cached = cache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const query = encodeURIComponent(`artist:"${escapeQuery(name)}"`);
    const search = await throttledGet<{ artists?: SearchCandidate[] }>(
      `/artist?query=${query}&limit=5&fmt=json`
    );
    const match = pickArtist(search, name, genre);
    if (!match) return null;
    return parseArtist(await throttledGet<LookupResponse>(`/artist/${match.id}?inc=genres+url-rels&fmt=json`));
  })();

  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}
