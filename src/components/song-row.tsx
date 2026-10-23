import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProfileSong } from '@/data/songs';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

type Props = {
  song: ProfileSong;
  playing: boolean;
  onTogglePlay: () => void;
  /** Al tocar la fila (fuera del botón de play). */
  onPress?: () => void;
  /** Lo que va a la derecha del botón de play (p. ej. "Quitar"). */
  trailing?: ReactNode;
};

/** Canción con carátula, título, artista y botón para oír su fragmento. */
export function SongRow({ song, playing, onTogglePlay, onPress, trailing }: Props) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityLabel={`${song.title}, de ${song.artist}`}
    >
      {song.artwork ? (
        <Image source={{ uri: song.artwork }} style={styles.artwork} />
      ) : (
        <View style={[styles.artwork, styles.noArtwork]}>
          <Ionicons name="musical-notes" size={20} color={COLORS.lavender} />
        </View>
      )}

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>

      <Pressable
        onPress={onTogglePlay}
        hitSlop={10}
        style={styles.play}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pausar fragmento' : 'Escuchar fragmento'}
      >
        <Ionicons name={playing ? 'pause' : 'play'} size={16} color={theme.accent} />
      </Pressable>
      {trailing}
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    pressed: { opacity: 0.6 },
    artwork: { width: 48, height: 48, borderRadius: 8, backgroundColor: COLORS.surface },
    noArtwork: { alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1 },
    title: { color: COLORS.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
    artist: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
    play: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
