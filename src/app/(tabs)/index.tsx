import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { EventImage } from '@/components/event-image';
import { GoButton } from '@/components/go-button';
import {
  TITLE_LINE_HEIGHT,
  TITLE_SIZE,
  TITLE_SPACING,
  TITLE_TOP,
} from '@/components/screen-title';
import { SearchBar } from '@/components/search-bar';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { activeFilterCount, SORT_OPTIONS, WHEN_OPTIONS } from '@/data/filters';
import { COLORS } from '@/theme';

// Ajustes del banner (puedes tocar estos números)
const LOGO_MAX = 72; // tamaño del logo arriba del todo
const LOGO_MIN = TITLE_SIZE; // ya encogido: igual que los títulos de Descubrir, meeet in y Perfil
const LINE_MAX = 83; // altura de la caja del logo grande
const LINE_MIN = TITLE_LINE_HEIGHT; // caja del logo encogido = la de los títulos de pestaña
const PAD_MAX = 8; // aire inferior con el logo grande
const PAD_MIN = 20; // aire inferior con el logo encogido
const TOP_MAX = 50; // aire superior con el logo grande
const TOP_MIN = TITLE_TOP; // aire superior con el logo encogido (= títulos de pestaña)
const SLOGAN_H = 22; // altura del lema
const SCROLL_RANGE = 80; // cuánto scroll dura la animación

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    concerts,
    visibleConcerts,
    loading,
    error,
    isGoing,
    toggleGoing,
    goingCount,
    filters,
    setFilters,
    resetFilters,
  } = useApp();
  const scrollY = useAnimatedValue(0);
  const filterCount = activeFilterCount(filters);
  const sortLabel = SORT_OPTIONS.find((o) => o.key === filters.sort)?.label.toLowerCase();
  const searching = filters.query.trim().length > 0;
  const isFiltered = filterCount > 0 || filters.when !== 'all' || searching;

  const shrink = (from: number, to: number) =>
    scrollY.interpolate({
      inputRange: [0, SCROLL_RANGE],
      outputRange: [from, to],
      extrapolate: 'clamp',
    });

  const logoSize = shrink(LOGO_MAX, LOGO_MIN);
  const logoLine = shrink(LINE_MAX, LINE_MIN);
  const logoSpacing = shrink(-2, TITLE_SPACING);
  const headerPadTop = shrink(insets.top + TOP_MAX, insets.top + TOP_MIN);
  const headerPadBottom = shrink(PAD_MAX, PAD_MIN);
  const sloganHeight = shrink(SLOGAN_H, 0);
  const sloganOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_RANGE * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const lineOpacity = scrollY.interpolate({
    inputRange: [SCROLL_RANGE - 20, SCROLL_RANGE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={visibleConcerts}
        keyExtractor={(item: Concert) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        contentContainerStyle={{
          paddingTop: insets.top + TOP_MAX + LINE_MAX + PAD_MAX + 4 + SLOGAN_H,
          paddingBottom: insets.bottom + BottomTabInset + 32,
        }}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.search}>
              <SearchBar
                value={filters.query}
                onChangeText={(query) => setFilters((f) => ({ ...f, query }))}
                placeholder="Artista, sala o género"
              />
            </View>

            <View style={styles.notice}>
              <View style={styles.betaTag}>
                <Text style={styles.betaTagText}>BETA</Text>
              </View>
              <Text style={styles.noticeText}>Solo disponible en Barcelona</Text>
            </View>

            {concerts.length > 0 && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.toolbar}
                >
                  <Chip
                    icon="options-outline"
                    label={filterCount > 0 ? `Filtros · ${filterCount}` : 'Filtros'}
                    active={filterCount > 0}
                    onPress={() => router.push('/filters')}
                  />
                  {WHEN_OPTIONS.filter((o) => o.key !== 'all').map((o) => (
                    <Chip
                      key={o.key}
                      label={o.label}
                      active={filters.when === o.key}
                      onPress={() =>
                        setFilters((f) => ({ ...f, when: f.when === o.key ? 'all' : o.key }))
                      }
                    />
                  ))}
                </ScrollView>
                <Text style={styles.results}>
                  {visibleConcerts.length}{' '}
                  {visibleConcerts.length === 1 ? 'concierto' : 'conciertos'} · por {sortLabel}
                </Text>
              </>
            )}

            {loading && <ActivityIndicator color={COLORS.accent} style={{ marginTop: 32 }} />}
            {error && (
              <Text style={styles.message}>No se han podido cargar los conciertos: {error}</Text>
            )}
            {!loading && !error && concerts.length === 0 && (
              <Text style={styles.message}>No hay conciertos disponibles ahora mismo.</Text>
            )}
            {concerts.length > 0 && visibleConcerts.length === 0 && isFiltered && (
              <View style={styles.emptyFiltered}>
                <Text style={styles.message}>
                  {searching && filterCount === 0 && filters.when === 'all'
                    ? `Ningún concierto coincide con «${filters.query.trim()}».`
                    : 'Ningún concierto coincide con tus filtros.'}
                </Text>
                <Pressable onPress={resetFilters} hitSlop={8}>
                  <Text style={styles.link}>{searching ? 'Borrar búsqueda y filtros' : 'Quitar filtros'}</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        renderItem={({ item }: { item: Concert }) => {
          const going = isGoing(item.id);
          const count = goingCount(item);
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: '/concert/[id]', params: { id: item.id } })}
            >
              <EventImage concert={item} going={going} />

              <View style={styles.cardBody}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.date}>{item.date}</Text>
                  <Text style={styles.artist} numberOfLines={2}>
                    {item.artist}
                  </Text>
                  <Text style={styles.venue} numberOfLines={1}>
                    {item.venue}
                  </Text>
                  <Text style={styles.going}>
                    {count === 0
                      ? 'Sé el primero en apuntarte'
                      : `${count} ${count === 1 ? 'persona va' : 'personas van'}`}
                  </Text>
                </View>
                <GoButton isGoing={going} onPress={() => toggleGoing(item)} />
              </View>
            </Pressable>
          );
        }}
      />

      <Animated.View
        style={[styles.header, { paddingTop: headerPadTop, paddingBottom: headerPadBottom }]}
      >
        <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.glass]} />

        <Animated.View style={[styles.logoRow, { height: logoLine }]}>
          <Animated.Text
            style={[
              styles.logo,
              { fontSize: logoSize, lineHeight: logoLine, letterSpacing: logoSpacing },
            ]}
          >
            meeet<Text style={{ color: COLORS.peach }}>.</Text>
          </Animated.Text>
        </Animated.View>

        <Animated.Text
          numberOfLines={1}
          style={[styles.slogan, { height: sloganHeight, opacity: sloganOpacity }]}
        >
          Every event. Everyone.
        </Animated.Text>

        <Animated.View style={[styles.line, { opacity: lineOpacity }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  glass: { backgroundColor: 'rgba(255,255,255,0.45)' },
  logoRow: { justifyContent: 'center' },
  logo: {
    alignSelf: 'flex-start',
    color: COLORS.accent,
    fontWeight: '800',
  },
  slogan: {
    alignSelf: 'flex-start',
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: -6,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.line,
  },
  listHeader: { marginBottom: 20 },
  search: { paddingHorizontal: 20, marginBottom: 16 },
  notice: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 20,
  },
  betaTag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  betaTagText: { color: COLORS.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  noticeText: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
  toolbar: { gap: 8, paddingHorizontal: 20, marginTop: 20 },
  results: { color: COLORS.muted, fontSize: 13, paddingHorizontal: 20, marginTop: 12 },
  message: { color: COLORS.muted, fontSize: 15, marginTop: 24, paddingHorizontal: 20 },
  emptyFiltered: { gap: 12 },
  link: { color: COLORS.accent, fontSize: 15, fontWeight: '700', paddingHorizontal: 20 },
  card: { marginBottom: 32 },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  date: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  artist: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  venue: { color: COLORS.muted, fontSize: 15, marginTop: 2 },
  going: { color: COLORS.muted, fontSize: 13, marginTop: 10 },
});