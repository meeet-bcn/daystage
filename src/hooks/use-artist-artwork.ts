// Imagen del artista para los conciertos sin foto (carátula de Apple Music).
// Apple limita las búsquedas (~20 por minuto), y en Inicio puede haber muchos
// conciertos sin foto, así que:
// - solo se busca cuando el concierto se pinta en pantalla;
// - las búsquedas van de una en una, con una pausa entre ellas;
// - el resultado (también "no hay") se guarda en el móvil y no se repite.

import { useEffect, useState } from 'react';

import { fetchArtistArtwork } from '@/data/songs';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/data/storage';
import { compactText, headlinerName } from '@/data/text';

const GAP_MS = 3000; // entre una búsqueda y la siguiente

// artista → URL ('' = buscado y sin imagen)
const saved: Record<string, string> = loadJSON(STORAGE_KEYS.artwork, {});
const pending = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();

const keyOf = (artist: string) => compactText(headlinerName(artist));

function lookup(artist: string): Promise<string> {
  const key = keyOf(artist);
  if (key in saved) return Promise.resolve(saved[key]);
  const existing = pending.get(key);
  if (existing) return existing;
  const run = queue.then(() => fetchArtistArtwork(artist));
  queue = run.catch(() => {}).then(() => new Promise((resolve) => setTimeout(resolve, GAP_MS)));
  const result = run
    .then((url) => {
      saved[key] = url;
      saveJSON(STORAGE_KEYS.artwork, saved);
      return url;
    })
    // Un error de red no se guarda: se volverá a intentar otro día
    .catch(() => '')
    .finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}

/** URL de la imagen del artista, o '' (mientras se busca o si no hay). Solo si `enabled`. */
export function useArtistArtwork(artist: string, enabled: boolean) {
  const key = keyOf(artist);
  const [found, setFound] = useState<{ key: string; url: string } | null>(null);

  useEffect(() => {
    if (!enabled || !artist) return;
    let active = true;
    lookup(artist).then((url) => active && setFound({ key, url }));
    return () => {
      active = false;
    };
  }, [artist, key, enabled]);

  if (!enabled) return '';
  return found?.key === key ? found.url : (saved[key] ?? '');
}
