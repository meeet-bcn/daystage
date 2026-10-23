// Canción del perfil: búsqueda en el catálogo de Apple Music con la API de
// búsqueda de iTunes (https://performance-partners.apple.com/search-api).
// Es gratis, sin clave ni cuenta, y trae un fragmento de 30 s de cada canción.
// Condiciones de Apple: los fragmentos solo se reproducen en streaming (nunca
// se descargan) y junto a ellos va un enlace a la canción en Apple Music.

import { compactText, headlinerName } from '@/data/text';

export type ProfileSong = {
  id: string;
  title: string;
  artist: string;
  /** Carátula cuadrada de 300 px, o '' si no hay. */
  artwork: string;
  /** Fragmento de 30 s (m4a por https). */
  preview: string;
  /** La canción en Apple Music. */
  url: string;
};

const SEARCH_URL = 'https://itunes.apple.com/search';
const SEARCH_LIMIT = 25;
const ARTWORK_SIZE = 300;

type ItunesTrack = {
  trackId?: number;
  artistId?: number;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
};

/** Convierte un resultado de iTunes; null si le falta el fragmento o los datos básicos. */
export function toSong(track: ItunesTrack): ProfileSong | null {
  const { trackId, trackName, artistName, previewUrl, trackViewUrl } = track;
  if (!trackId || !trackName || !artistName || !previewUrl || !trackViewUrl) return null;
  return {
    id: String(trackId),
    title: trackName,
    artist: artistName,
    // La URL lleva el tamaño dentro ("…/100x100bb.jpg"): se pide una mayor
    artwork: (track.artworkUrl100 ?? '').replace(
      /\/\d+x\d+bb\./,
      `/${ARTWORK_SIZE}x${ARTWORK_SIZE}bb.`
    ),
    preview: previewUrl,
    url: trackViewUrl,
  };
}

async function searchTracks(
  term: string,
  extra: Record<string, string>,
  signal?: AbortSignal
): Promise<ItunesTrack[]> {
  const params = new URLSearchParams({
    term,
    media: 'music',
    entity: 'song',
    country: 'es',
    limit: String(SEARCH_LIMIT),
    ...extra,
  });
  const res = await fetch(`${SEARCH_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Apple Music respondió ${res.status}`);
  const data: { results?: ItunesTrack[] } = await res.json();
  return data.results ?? [];
}

/** Busca canciones en el catálogo español de Apple Music. */
export async function searchSongs(term: string, signal?: AbortSignal): Promise<ProfileSong[]> {
  const tracks = await searchTracks(term, {}, signal);
  return tracks.map(toSong).filter((s): s is ProfileSong => s !== null);
}

// "Chameleons" y "The Chameleons" son el mismo nombre
const comparable = (name: string) => compactText(name.replace(/^the\s+/i, ''));
// Artista principal de una canción: "ROSALÍA & Björk" o "ROSALÍA, Björk" → "ROSALÍA"
const mainArtist = (name: string) => name.split(/\s*(?:,|&|\sx\s|\s(?:feat|ft)\.?\s)\s*/i)[0];

/**
 * La canción más popular del artista (iTunes ordena por relevancia) entre los
 * resultados. Como en MusicBrainz, ante la duda null: si hay varios artistas
 * distintos con ese nombre, no se elige ninguno.
 */
export function pickTopSong(tracks: ItunesTrack[], artistName: string): ProfileSong | null {
  const wanted = comparable(artistName);
  if (!wanted) return null;
  const matches = tracks.filter(
    (t) => t.artistName && comparable(mainArtist(t.artistName)) === wanted
  );
  const artistIds = new Set(matches.map((t) => t.artistId));
  if (artistIds.size !== 1) return null;
  for (const track of matches) {
    const song = toSong(track);
    if (song) return song;
  }
  return null;
}

/** Fragmento de la canción más popular del artista de un concierto, o null. */
export async function fetchTopSong(eventName: string): Promise<ProfileSong | null> {
  const artist = headlinerName(eventName);
  const tracks = await searchTracks(artist, { attribute: 'artistTerm' });
  return pickTopSong(tracks, artist);
}
