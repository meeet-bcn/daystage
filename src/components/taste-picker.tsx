import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { languageLabel } from '@/data/settings';
import {
  pickLanguages,
  TASTE_ARTISTS,
  TASTE_PICKS,
  TasteArtist,
  tasteWeights,
  topTastes,
} from '@/data/taste';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

// Ajustes del carrusel
const CIRCLE = 96;

const ROWS: { title: string; match: (a: TasteArtist) => boolean }[] = [
  { title: 'Internacional', match: (a) => a.language === 'en' || a.language === 'fr' },
  { title: 'España', match: (a) => a.language === 'es' },
  { title: 'Catalunya', match: (a) => a.language === 'ca' },
];

const languageName = (code: string) => (code === 'fr' ? 'Français' : languageLabel(code));

/**
 * Elige tus 5 artistas: carruseles de grandes nombres en círculo. Mientras
 * eliges, se ve qué estilos e idiomas reconoce la app.
 */
export function TastePicker({ onDone }: { onDone: (picks: string[]) => void }) {
  const styles = useThemedStyles(makeStyles);
  const [picks, setPicks] = useState<string[]>([]);
  const full = picks.length === TASTE_PICKS;

  const styleNames = topTastes(tasteWeights({ picks, plans: [], wishlist: [], swipes: {} }), 3);
  const languages = pickLanguages(picks).map(languageName);

  const toggle = (id: string) =>
    setPicks((current) =>
      current.includes(id)
        ? current.filter((p) => p !== id)
        : current.length < TASTE_PICKS
          ? [...current, id]
          : current
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Elige {TASTE_PICKS} artistas que te encanten</Text>
        <Text style={styles.count}>
          {picks.length}/{TASTE_PICKS}
        </Text>
      </View>
      {/* Lo que la app va entendiendo de ti */}
      <Text style={styles.detected} numberOfLines={2}>
        {picks.length === 0
          ? 'Con ellos sabremos qué estilos y en qué idiomas te gusta la música.'
          : `Te va: ${styleNames.join(', ')}${languages.length ? ` · en ${languages.join(', ')}` : ''}`}
      </Text>

      <ScrollView style={styles.rows} contentContainerStyle={styles.rowsContent}>
        {ROWS.map((row) => (
          <View key={row.title} style={styles.row}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {TASTE_ARTISTS.filter(row.match).map((artist) => {
                const order = picks.indexOf(artist.id);
                const picked = order >= 0;
                return (
                  <Pressable
                    key={artist.id}
                    onPress={() => toggle(artist.id)}
                    disabled={full && !picked}
                    style={[styles.artist, full && !picked && styles.dimmed]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: picked }}
                    accessibilityLabel={artist.name}
                  >
                    <View style={[styles.ring, picked && styles.ringPicked]}>
                      <Image source={{ uri: artist.image }} style={styles.photo} transition={200} />
                      {picked && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{order + 1}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.name} numberOfLines={2}>
                      {artist.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={[styles.done, !full && styles.doneDisabled]}
        disabled={!full}
        onPress={() => onDone(picks)}
      >
        <Ionicons name="sparkles" size={18} color={COLORS.white} />
        <Text style={styles.doneText}>
          {full ? 'Crear mis gustos' : `Elige ${TASTE_PICKS - picks.length} más`}
        </Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 20,
    },
    title: { flex: 1, color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    count: { color: theme.accent, fontSize: 17, fontWeight: '800', marginTop: 3 },
    detected: {
      color: COLORS.muted,
      fontSize: 14,
      lineHeight: 19,
      paddingHorizontal: 20,
      marginTop: 6,
      minHeight: 38,
    },
    rows: { flex: 1 },
    rowsContent: { paddingBottom: 16 },
    row: { marginTop: 14 },
    rowTitle: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    carousel: { gap: 14, paddingHorizontal: 20 },
    artist: { width: CIRCLE + 8, alignItems: 'center' },
    dimmed: { opacity: 0.4 },
    ring: {
      width: CIRCLE + 8,
      height: CIRCLE + 8,
      borderRadius: (CIRCLE + 8) / 2,
      borderWidth: 3,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringPicked: { borderColor: theme.accent },
    photo: {
      width: CIRCLE,
      height: CIRCLE,
      borderRadius: CIRCLE / 2,
      backgroundColor: COLORS.surface,
    },
    badge: {
      position: 'absolute',
      right: 0,
      top: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.accent,
      borderWidth: 2,
      borderColor: COLORS.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
    name: {
      color: COLORS.text,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 6,
    },
    done: {
      flexDirection: 'row',
      gap: 8,
      height: 54,
      borderRadius: 27,
      marginHorizontal: 20,
      marginTop: 8,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneDisabled: { backgroundColor: COLORS.line },
    doneText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  });
