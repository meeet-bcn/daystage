import { useEffect, useState } from 'react';

import { ArtistInfo, fetchArtistInfo } from '@/data/musicbrainz';

/** Info de MusicBrainz del artista de un concierto. `info` es null si no se encontró. */
export function useArtistInfo(eventName: string, genre: string) {
  const key = `${eventName}|${genre}`;
  const [result, setResult] = useState<{ key: string; info: ArtistInfo | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetchArtistInfo(eventName, genre)
      .then((info) => active && setResult({ key, info }))
      .catch(() => active && setResult({ key, info: null }));
    return () => {
      active = false;
    };
  }, [key, eventName, genre]);

  // Un resultado de otro concierto no vale: se sigue cargando
  const current = result?.key === key ? result : null;
  return { info: current?.info ?? null, loading: current == null };
}
