import { useEffect, useState } from 'react';

import { fetchTopSong, ProfileSong } from '@/data/songs';

/** Canción más popular del artista de un concierto (Apple Music). null si no se encuentra. */
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

  // Un resultado de otro concierto no vale
  return result?.key === eventName ? result.song : null;
}
