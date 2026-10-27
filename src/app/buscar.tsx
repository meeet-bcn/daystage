import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConcertImage } from '@/components/concert-image';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { useConcertSearch } from '@/hooks/use-concert-search';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

export default function SearchScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isGoing } = useApp();
  const [query, setQuery] = useState('');
  const { results, searching, error } = useConcertSearch(query);
  const term = query.trim();
  const scrollY = useAnimatedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        // El margen superior lo pone la cabecera fija; sin esto iOS lo suma otra vez
        contentInsetAdjustmentBehavior="never"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ top: headerHeight }}
        data={results}
        keyExtractor={(item: Concert) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + 32,
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          searching && results.length === 0 ? (
            <ActivityIndicator color={theme.accent} style={styles.spinner} />
          ) : undefined
        }
        ListEmptyComponent={
          searching ? undefined : (
            <Text style={styles.empty}>
              {error
                ? `No se ha podido buscar: ${error}`
                : term.length >= 2
                  ? `Ningún concierto coincide con «${term}».`
                  : 'Busca entre todos los conciertos de Barcelona por artista, sala o género.'}
            </Text>
          )
        }
        // Siempre al final (y sola si no hay resultados): añadir lo que no aparece
        ListFooterComponent={
          searching ? undefined : (
            <Pressable
              style={({ pressed }) => [styles.addEvent, pressed && styles.pressed]}
              onPress={() =>
                router.push({ pathname: '/event-form', params: term.length >= 2 ? { title: term } : {} })
              }
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addEventTitle}>¿No lo encuentras? Añádelo</Text>
                <Text style={styles.addEventText}>Público para todos o privado para ti y tu gente</Text>
              </View>
            </Pressable>
          )
        }
        renderItem={({ item }: { item: Concert }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/concert/[id]', params: { id: item.id } })}
          >
            <ConcertImage concert={item} style={styles.thumb} iconSize={24} />
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
            {isGoing(item.id) && <Text style={styles.going}>Voy</Text>}
          </Pressable>
        )}
      />
      {/* Fija arriba, de cristal, con el buscador siempre a mano */}
      <ScreenHeader
        title="Buscar"
        scrollY={scrollY}
        onHeight={setHeaderHeight}
        accessory={
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        }
      >
        <View style={styles.search}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Artista, sala o género"
            autoFocus
          />
        </View>
      </ScreenHeader>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    close: { marginLeft: 'auto' },
    addEvent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: 20,
      marginTop: 20,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.accentSoft,
    },
    addEventTitle: { color: theme.accent, fontSize: 16, fontWeight: '700' },
    addEventText: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
    closeText: { color: theme.accent, fontSize: 16, fontWeight: '600' },
    container: { flex: 1, backgroundColor: COLORS.background },
    search: { paddingHorizontal: 20, paddingBottom: 12 },
    spinner: { marginTop: 24 },
    empty: {
      color: COLORS.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      paddingHorizontal: 32,
      paddingTop: 24,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    pressed: { opacity: 0.6 },
    thumb: { width: 64, height: 64, borderRadius: 14, backgroundColor: COLORS.surface },
    text: { flex: 1 },
    date: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    artist: {
      color: COLORS.text,
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
      marginTop: 2,
    },
    venue: { color: COLORS.muted, fontSize: 14, marginTop: 2 },
    going: { color: theme.accent, fontSize: 13, fontWeight: '800' },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: COLORS.line,
      marginLeft: 98,
    },
  });
