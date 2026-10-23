import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenTitle } from '@/components/screen-title';
import { SearchBar } from '@/components/search-bar';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { useConcertSearch } from '@/hooks/use-concert-search';
import { COLORS } from '@/theme';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { isGoing } = useApp();
  const [query, setQuery] = useState('');
  const { results, searching, error } = useConcertSearch(query);
  const term = query.trim();

  return (
    <FlatList
      // El margen superior lo pone ScreenTitle; sin esto iOS lo suma otra vez
      contentInsetAdjustmentBehavior="never"
      style={styles.container}
      data={results}
      keyExtractor={(item: Concert) => item.id}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 32 }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <View>
          <ScreenTitle title="Buscar" />
          <View style={styles.search}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Artista, sala o género" />
          </View>
          {searching && results.length === 0 ? (
            <ActivityIndicator color={COLORS.accent} style={styles.spinner} />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        searching ? null : (
          <Text style={styles.empty}>
            {error
              ? `No se ha podido buscar: ${error}`
              : term.length >= 2
                ? `Ningún concierto coincide con «${term}».`
                : 'Busca entre todos los conciertos de Barcelona por artista, sala o género.'}
          </Text>
        )
      }
      renderItem={({ item }: { item: Concert }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/concert/[id]', params: { id: item.id } })}
        >
          <Image source={item.image || undefined} style={styles.thumb} transition={150} />
          <View style={styles.text}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.artist} numberOfLines={1}>
              {item.artist}
            </Text>
            <Text style={styles.venue} numberOfLines={1}>
              {item.venue}
              {item.genre ? ` · ${item.genre}` : ''}
            </Text>
          </View>
          {isGoing(item.id) && <Text style={styles.going}>Meeet In!</Text>}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  search: { paddingHorizontal: 20, paddingBottom: 16 },
  spinner: { marginTop: 24 },
  empty: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
  pressed: { opacity: 0.6 },
  thumb: { width: 64, height: 64, borderRadius: 14, backgroundColor: COLORS.surface },
  text: { flex: 1 },
  date: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  artist: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginTop: 2 },
  venue: { color: COLORS.muted, fontSize: 14, marginTop: 2 },
  going: { color: COLORS.accent, fontSize: 13, fontWeight: '800' },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.line,
    marginLeft: 98,
  },
});
