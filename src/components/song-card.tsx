import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { SongRow } from '@/components/song-row';
import type { ProfileSong } from '@/data/songs';
import { useSongPreview } from '@/hooks/use-song-preview';
import { COLORS } from '@/theme';

/**
 * Tarjeta de una canción con su fragmento y el enlace a Apple Music: la del
 * perfil y la del artista en el detalle de un concierto.
 */
export function SongCard({ song, title }: { song: ProfileSong; title?: string }) {
  const preview = useSongPreview();
  const { stop } = preview;

  // Al salir de la pantalla (las pestañas no se desmontan), para la música
  useFocusEffect(useCallback(() => stop, [stop]));

  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <SongRow
        song={song}
        playing={preview.isPlaying(song)}
        onTogglePlay={() => preview.toggle(song)}
      />
      {/* Apple pide enlazar a la canción junto al fragmento */}
      <Pressable
        onPress={() => Linking.openURL(song.url)}
        hitSlop={8}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        accessibilityRole="link"
      >
        <Ionicons name="logo-apple" size={13} color={COLORS.muted} />
        <Text style={styles.linkText}>Escuchar en Apple Music</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, padding: 12, borderRadius: 16, backgroundColor: COLORS.surface },
  title: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  linkText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
