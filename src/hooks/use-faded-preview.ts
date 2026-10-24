// Fragmento de la carta de arriba en Descubrir: entra con un fundido suave
// (de silencio a volumen normal) para que no suene de golpe, y se para al
// cambiar de carta, al silenciarlo o al salir de la pestaña.

import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

import type { ProfileSong } from '@/data/songs';
import { ensureAudioMode } from '@/hooks/use-song-preview';

// Ajustes del fundido
const FADE_MS = 1200;
const FADE_STEP_MS = 50;

export function useFadedPreview(song: ProfileSong | null, playing: boolean) {
  const player = useAudioPlayer(null);

  useEffect(() => {
    if (!song || !playing) {
      player.pause();
      return;
    }
    let ramp: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;
    ensureAudioMode().then(() => {
      if (cancelled) return;
      player.replace({ uri: song.preview });
      player.volume = 0;
      player.play();
      const step = FADE_STEP_MS / FADE_MS;
      ramp = setInterval(() => {
        const next = Math.min(1, player.volume + step);
        player.volume = next;
        if (next >= 1) clearInterval(ramp);
      }, FADE_STEP_MS);
    });
    return () => {
      cancelled = true;
      clearInterval(ramp);
      try {
        player.pause();
      } catch {
        // Al desmontar, el reproductor puede estar ya liberado
      }
    };
  }, [song, playing, player]);
}
