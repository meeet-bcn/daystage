import { useEffect, useState } from 'react';

import { fetchTopSong, ProfileSong } from '@/data/songs';

/**
 * Canción más popular del artista de un concierto (Apple Music): `song` es
 * null si no se encuentra; `loading`, mientras se busca.
 */
export function useTopSong(eventName: string) {
  const [result, setResult] = useState<{ key: string; song: ProfileSong | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetchTopSong(eventName)
      .then((song) => active && setResult({ key: eventName, song }))
      .catch(() => active && setResult({ key: eventName, song: null }));
    return () => {
      active = false;
    };
  }, [eventName]);

  // Un resultado de otro concierto no vale: se sigue buscando
  const current = result?.key === eventName ? result : null;
  return { song: current?.song ?? null, loading: current == null };
}
