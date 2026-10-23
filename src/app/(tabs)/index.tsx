import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import {
  activeFilterCount,
  dateRangeLabel,
  LANGUAGES,
  SORT_OPTIONS,
} from '@/data/filters';
import { COLORS } from '@/theme';

// Ajustes del banner (puedes tocar estos números)
const LOGO_MAX = 72; // tamaño del logo arriba del todo
const LOGO_MIN = TITLE_SIZE; // ya encogido: igual que los títulos de Descubrir, meeet in y Perfil
const LINE_MAX = 83; // altura de la caja del logo grande
const LINE_MIN = TITLE_LINE_HEIGHT; // caja del logo encogido = la de los títulos de pestaña
const PAD_MAX = 8; // aire inferior con el logo grande
const PAD_MIN = 12; // aire inferior con el logo encogido (bajo los chips)
const TOP_MAX = 50; // aire superior con el logo grande
const TOP_MIN = TITLE_TOP; // aire superior con el logo encogido (= títulos de pestaña)
const SLOGAN_H = 22; // altura del lema
const TOOLS_GAP = 14; // aire entre el logo (o el aviso) y los chips, también con el logo encogido
const NOTICE_H = 40; // aviso de la beta (pastilla de 32 + aire); se esconde al hacer scroll
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
    resetFilters,
    loadMore,
    hasMore,
    loadingMore,
  } = useApp();
  const scrollY = useAnimatedValue(0);
  // Alto de los chips, fijos en la cabecera: la lista empieza debajo
  const [toolsHeight, setToolsHeight] = useState(0);
  const filterCount = activeFilterCount(filters);
  const sortLabel = SORT_OPTIONS.find((o) => o.key === filters.sort)?.label.toLowerCase();
  const isFiltered = filterCount > 0 || filters.dates != null;
  const languages = LANGUAGES.filter((l) => filters.languages.includes(l.code));

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
  const noticeHeight = shrink(NOTICE_H, 0);
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
        // Al acercarse al final se pide la siguiente página (también si los
        // filtros dejan la lista corta: FlatList avisa en cuanto no la llena)
        onEndReached={loadMore}
        onEndReachedThreshold={1.5}
        // Rendimiento: tarjetas grandes con foto, se pintan pocas a la vez
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={COLORS.accent} style={styles.more} /> : null
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        contentContainerStyle={{
          paddingTop: insets.top + TOP_MAX + LINE_MAX + SLOGAN_H + NOTICE_H + toolsHeight + PAD_MAX,
          paddingBottom: insets.bottom + BottomTabInset + 32,
        }}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {concerts.length > 0 && (
              <Text style={styles.results}>
                {/* Mientras queden páginas, "20+": aún no están todos */}
                {visibleConcerts.length}
                {hasMore ? '+' : ''}{' '}
                {visibleConcerts.length === 1 && !hasMore ? 'concierto' : 'conciertos'} · por{' '}
                {sortLabel}
              </Text>
            )}

            {loading && <ActivityIndicator color={COLORS.accent} style={{ marginTop: 32 }} />}
            {error && (
              <Text style={styles.message}>No se han podido cargar los conciertos: {error}</Text>
            )}
            {!loading && !error && concerts.length === 0 && (
              <Text style={styles.message}>No hay conciertos disponibles ahora mismo.</Text>
            )}
            {/* Solo cuando ya están todos: si quedan páginas, aún pueden aparecer */}
            {concerts.length > 0 && visibleConcerts.length === 0 && isFiltered && !hasMore && (
              <View style={styles.emptyFiltered}>
                <Text style={styles.message}>Ningún concierto coincide con tus filtros.</Text>
                <Pressable onPress={resetFilters} hitSlop={8}>
                  <Text style={styles.link}>Quitar filtros</Text>
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
              <EventImage concert={item} going={going} holo />

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
            {/* Las "eee" en la escala del salmón, de clara a oscura */}
            m<Text style={{ color: COLORS.peach }}>e</Text>
            <Text style={{ color: COLORS.peachMid }}>e</Text>
            <Text style={{ color: COLORS.peachDeep }}>e</Text>t
            <Text style={{ color: COLORS.accent }}>.</Text>
          </Animated.Text>
        </Animated.View>

        <Animated.Text
          numberOfLines={1}
          style={[styles.slogan, { height: sloganHeight, opacity: sloganOpacity }]}
        >
          Every event. Everyone.
        </Animated.Text>

        {/* El aviso se esconde con el lema; los chips quedan siempre a mano */}
        <Animated.View style={[styles.noticeBox, { height: noticeHeight, opacity: sloganOpacity }]}>
          <View style={styles.notice}>
            <View style={styles.betaTag}>
              <Text style={styles.betaTagText}>BETA</Text>
            </View>
            <Text style={styles.noticeText} numberOfLines={1}>
              Solo Barcelona · Ticketmaster
            </Text>
          </View>
        </Animated.View>

        <View
          style={styles.tools}
          onLayout={(e) => setToolsHeight(e.nativeEvent.layout.height)}
        >
          {concerts.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.toolbarScroll}
              contentContainerStyle={styles.toolbar}
            >
              <Chip
                icon="options-outline"
                label={filterCount > 0 ? `Filtros · ${filterCount}` : 'Filtros'}
                active={filterCount > 0}
                onPress={() => router.push('/filters')}
              />
              {/* Muchos son turistas: buscan sus días en Barcelona */}
              <Chip
                icon="calendar-outline"
                label={filters.dates ? dateRangeLabel(filters.dates) : 'Calendario'}
                active={filters.dates != null}
                onPress={() => router.push('/calendar')}
              />
              {/* El idioma de la gente que quieres conocer */}
              <Chip
                icon="chatbubbles-outline"
                label={
                  languages.length === 0
                    ? 'Idioma'
                    : languages.length === 1
                      ? languages[0].label
                      : `Idioma · ${languages.length}`
                }
                active={languages.length > 0}
                onPress={() => router.push('/language')}
              />
            </ScrollView>
          )}
        </View>

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
  // Logo, lema y aviso beta, centrados
  logo: {
    alignSelf: 'center',
    color: COLORS.text,
    fontWeight: '700',
  },
  slogan: {
    alignSelf: 'center',
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
  noticeBox: { overflow: 'hidden', justifyContent: 'center' },
  notice: {
    alignSelf: 'center',
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
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
  noticeText: { color: COLORS.muted, fontSize: 13, fontWeight: '500', flexShrink: 1 },
  // Los chips llegan hasta el borde de la pantalla al deslizarlos
  // El lema sube 6 pt sobre el logo (marginTop: -6): aquí se compensa para
  // que, ya encogido, los chips no pisen el logo
  tools: { paddingTop: TOOLS_GAP },
  toolbarScroll: { marginHorizontal: -20 },
  toolbar: { gap: 8, paddingHorizontal: 20 },
  results: { color: COLORS.muted, fontSize: 13, paddingHorizontal: 20 },
  message: { color: COLORS.muted, fontSize: 15, marginTop: 24, paddingHorizontal: 20 },
  emptyFiltered: { gap: 12 },
  more: { marginBottom: 24 },
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