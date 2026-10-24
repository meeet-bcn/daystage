import { useEffect, useState } from 'react';

import { fetchSetlists, hasSetlistKey, Setlist } from '@/data/setlists';

/** Setlists anteriores del artista (setlist.fm). `available`: si hay clave configurada. */
export function useSetlists(artist: string) {
  const available = hasSetlistKey();
  const [result, setResult] = useState<{
    key: string;
    setlists: Setlist[];
    error: boolean;
  } | null>(null);

  useEffect(() => {
    if (!available || !artist) return;
    let active = true;
    fetchSetlists(artist)
      .then((setlists) => active && setResult({ key: artist, setlists, error: false }))
      .catch(() => active && setResult({ key: artist, setlists: [], error: true }));
    return () => {
      active = false;
    };
  }, [artist, available]);

  const current = result?.key === artist ? result : null;
  return {
    available,
    loading: available && current == null,
    setlists: current?.setlists ?? [],
    error: current?.error ?? false,
  };
}
