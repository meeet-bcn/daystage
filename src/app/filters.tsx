import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { useApp } from '@/data/app-context';
import { PRICE_OPTIONS, SORT_OPTIONS } from '@/data/filters';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

export default function FiltersSheet() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { filters, setFilters, resetFilters, genres, visibleConcerts } = useApp();
  const count = visibleConcerts.length;

  const toggleGenre = (genre: string) =>
    setFilters((f) => ({
      ...f,
      genres: f.genres.includes(genre) ? f.genres.filter((g) => g !== genre) : [...f.genres, genre],
    }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Filtros</Text>
        <Pressable onPress={resetFilters} hitSlop={8}>
          <Text style={styles.reset}>Restablecer</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Ordenar por</Text>
      <View style={styles.chips}>
        {SORT_OPTIONS.map((o) => (
          <Chip
            key={o.key}
            label={o.label}
            active={filters.sort === o.key}
            onPress={() => setFilters((f) => ({ ...f, sort: o.key }))}
          />
        ))}
      </View>

      {genres.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Género</Text>
          <View style={styles.chips}>
            {genres.map((g) => (
              <Chip
                key={g}
                label={g}
                active={filters.genres.includes(g)}
                onPress={() => toggleGenre(g)}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Precio</Text>
      <View style={styles.chips}>
        {PRICE_OPTIONS.map((o) => (
          <Chip
            key={o.label}
            label={o.label}
            active={filters.maxPrice === o.value}
            onPress={() => setFilters((f) => ({ ...f, maxPrice: o.value }))}
          />
        ))}
      </View>

      <Pressable style={styles.apply} onPress={() => router.back()}>
        <Text style={styles.applyText}>
          {count === 0
            ? 'Ningún concierto'
            : `Ver ${count} ${count === 1 ? 'concierto' : 'conciertos'}`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { backgroundColor: COLORS.background },
    content: { padding: 20, paddingTop: 28 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: COLORS.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
    reset: { color: theme.accent, fontSize: 15, fontWeight: '700' },
    sectionTitle: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 28,
      marginBottom: 12,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    apply: {
      height: 54,
      borderRadius: 27,
      backgroundColor: COLORS.text,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 36,
    },
    applyText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  });
