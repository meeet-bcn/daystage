// Setlists de conciertos anteriores del artista, de setlist.fm
// (https://api.setlist.fm/docs/1.0/index.html). La API es gratis para uso no
// comercial, pero pide una clave: EXPO_PUBLIC_SETLISTFM_KEY en .env.local.
// Sin clave, la sala lo dice y no se pide nada.

import { compactText, headlinerName } from '@/data/text';

export type Setlist = {
  id: string;
  /** Día del concierto (YYYY-MM-DD). */
  date: string;
  venue: string;
  city: string;
  tour: string;
  songs: string[];
  url: string;
};

type RawSetlist = {
  id?: string;
  eventDate?: string; // "24-10-2025"
  artist?: { name?: string };
  venue?: { name?: string; city?: { name?: string; country?: { name?: string } } };
  tour?: { name?: string };
  sets?: { set?: { song?: { name?: string }[] }[] };
  url?: string;
};

const API = 'https://api.setlist.fm/rest/1.0/search/setlists';
const MAX = 10;

export const hasSetlistKey = () => Boolean(process.env.EXPO_PUBLIC_SETLISTFM_KEY);

/**
 * Setlists del artista, del más reciente al más antiguo. Solo los de ese
 * artista (la búsqueda trae también nombres parecidos) y con canciones.
 */
export function parseSetlists(raw: { setlist?: RawSetlist[] }, artistName: string): Setlist[] {
  const wanted = compactText(headlinerName(artistName));
  return (raw.setlist ?? [])
    .filter((s) => compactText(s.artist?.name ?? '') === wanted)
    .map((s) => {
      const [day, month, year] = (s.eventDate ?? '').split('-');
      return {
        id: s.id ?? `${s.eventDate}-${s.venue?.name}`,
        date: year && month && day ? `${year}-${month}-${day}` : '',
        venue: s.venue?.name ?? '',
        city: [s.venue?.city?.name, s.venue?.city?.country?.name].filter(Boolean).join(', '),
        tour: s.tour?.name ?? '',
        songs: (s.sets?.set ?? [])
          .flatMap((set) => set.song ?? [])
          .map((song) => song.name ?? '')
          .filter(Boolean),
        url: s.url ?? '',
      };
    })
    .filter((s) => s.songs.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX);
}

export async function fetchSetlists(eventName: string): Promise<Setlist[]> {
  const key = process.env.EXPO_PUBLIC_SETLISTFM_KEY;
  if (!key) return [];
  const artist = headlinerName(eventName);
  const params = new URLSearchParams({ artistName: artist, p: '1' });
  const response = await fetch(`${API}?${params}`, {
    headers: { 'x-api-key': key, Accept: 'application/json', 'Accept-Language': 'es' },
  });
  // 404 = no hay setlists de ese artista
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`setlist.fm respondió ${response.status}`);
  return parseSetlists(await response.json(), artist);
}
