// Reproductor de fragmentos de canciones: uno solo por pantalla, así que al
// darle a otra canción la anterior se para. Se libera al desmontar.

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useState } from 'react';

import type { ProfileSong } from '@/data/songs';

// En iOS, hasta que se fija el modo de audio la sesión es "ambiente": el
// interruptor de silencio la deja muda. Se fija una vez, al primer play.
let audioMode: Promise<void> | null = null;
export const ensureAudioMode = () =>
  (audioMode ??= setAudioModeAsync({
    playsInSilentMode: true,
    // Como en Instagram: el fragmento pausa la música que tuvieras puesta
    interruptionMode: 'doNotMix',
  }).catch((e) => {
    audioMode = null;
    console.warn('[audio] No se pudo fijar el modo de audio:', e);
  }));

export function useSongPreview() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [currentId, setCurrentId] = useState<string | null>(null);

  /** Si suena (o está cargando para sonar) el fragmento de esa canción. */
  const isPlaying = (song: ProfileSong) =>
    currentId === song.id && !status.didJustFinish && (status.playing || !status.isLoaded);

  const toggle = async (song: ProfileSong) => {
    await ensureAudioMode();
    if (currentId === song.id && status.isLoaded) {
      if (status.playing) return player.pause();
      // Si ya terminó, vuelve a empezar
      if (status.didJustFinish || status.currentTime >= status.duration - 0.2) player.seekTo(0);
      return player.play();
    }
    player.replace({ uri: song.preview });
    setCurrentId(song.id);
    player.play();
  };

  // Estable: se usa como limpieza de useFocusEffect, que no debe repetirse en cada render
  const stop = useCallback(() => {
    try {
      player.pause();
    } catch {
      // Al desmontar, el reproductor puede estar ya liberado: no hay nada que parar
    }
    setCurrentId(null);
  }, [player]);

  return { isPlaying, toggle, stop };
}
