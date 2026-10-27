import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvailabilityPill } from '@/components/availability-pill';
import { Chip } from '@/components/chip';
import { EventImage } from '@/components/event-image';
import { GoButton } from '@/components/go-button';
import { Imagotipo } from '@/components/imagotipo';
import { WishButton } from '@/components/wish-button';
import { TITLE_LINE_HEIGHT, TITLE_SIZE, TITLE_SPACING, TITLE_TOP } from '@/components/screen-title';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import {
  activeFilterCount,
  dateRangeLabel,
  dayStart,
  isQuickRange,
  QUICK_DATES,
  quickRange,
  SORT_OPTIONS,
} from '@/data/filters';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

// Ajustes del banner (puedes tocar estos números)
// El título «Eventos» es como el de las demás pestañas: no crece ni se encoge
const LOGO_MAX = TITLE_SIZE;
const LOGO_MIN = TITLE_SIZE;
const LINE_MAX = TITLE_LINE_HEIGHT;
const LINE_MIN = TITLE_LINE_HEIGHT;
const PAD_MAX = 12; // aire bajo los chips
const PAD_MIN = 12;
const TOP_MAX = TITLE_TOP;
const TOP_MIN = TITLE_TOP;
const SLOGAN_H = 0; // sin lema
const TOOLS_GAP = 14; // aire entre el logo (o el aviso) y los chips, también con el logo encogido
const SCROLL_RANGE = 80; // cuánto scroll dura la animación
// Tirar hacia abajo para recargar
const PULL_TRIGGER = 80; // pt que hay que tirar para que, al soltar, recargue
const REFRESH_SPACE = 64; // hueco para el imagotipo mientras recarga
const REFRESH_MIN_MS = 600; // lo mínimo que se ve el imagotipo, aunque cargue antes

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
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
    trimConcerts,
    loadMore,
    hasMore,
    loadingMore,
    refreshConcerts,
    settings,
    availability,
    hasShifts,
  } = useApp();
  const scrollY = useAnimatedValue(0);
  const listRef = useRef<FlatList<Concert>>(null);
  const navigation = useNavigation();
  // Recarga: el imagotipo, quieto, en el hueco mientras carga
  const [refreshing, setRefreshing] = useState(false);
  const refreshSound = useAudioPlayer(require('@/assets/sounds/refresh.wav'));

  // Tocar Inicio estando ya en Inicio sube arriba del todo (además de lo que haga
  // iOS). El tipo de useNavigation no incluye 'tabPress' de NativeTabs: de ahí el cast
  useEffect(
    () =>
      navigation.addListener('tabPress' as never, () => {
        if (navigation.isFocused()) listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }),
    [navigation]
  );

  // Al soltar tras tirar lo bastante, recarga
  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (refreshing || e.nativeEvent.contentOffset.y > -PULL_TRIGGER) return;
    setRefreshing(true);
    if (settings.sounds) {
      refreshSound.seekTo(0);
      refreshSound.play();
    }
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const minimum = new Promise((resolve) => setTimeout(resolve, REFRESH_MIN_MS));
    Promise.all([refreshConcerts(), minimum]).finally(() => setRefreshing(false));
  };

  // Alto de los chips, fijos en la cabecera: la lista empieza debajo
  const [toolsHeight, setToolsHeight] = useState(0);
  // Hoy (medianoche), fijado al montar: leer la hora en cada render no es puro
  const [today] = useState(() => dayStart(Date.now()));
  // ¿Las fechas son un atajo (Hoy, Mañana, Próxima semana)? Si no, son del calendario
  const quick = QUICK_DATES.find((q) => isQuickRange(filters.dates, q.key, today))?.key;
  const filterCount = activeFilterCount(filters);
  const sortLabel = SORT_OPTIONS.find((o) => o.key === filters.sort)?.label.toLowerCase();
  // Donde empieza la lista: bajo la cabecera fija ya desplegada
  const listTop = insets.top + TOP_MAX + LINE_MAX + SLOGAN_H + toolsHeight + PAD_MAX;
  const isFiltered = filterCount > 0 || filters.dates != null || filters.freeDaysOnly;

  const shrink = (from: number, to: number) =>
    scrollY.interpolate({
      inputRange: [0, SCROLL_RANGE],
      outputRange: [from, to],
      extrapolate: 'clamp',
    });

  const logoSize = shrink(LOGO_MAX, LOGO_MIN);
  const logoLine = shrink(LINE_MAX, LINE_MIN);
  const logoSpacing = shrink(TITLE_SPACING, TITLE_SPACING);
  const headerPadTop = shrink(insets.top + TOP_MAX, insets.top + TOP_MIN);
  const headerPadBottom = shrink(PAD_MAX, PAD_MIN);
  const lineOpacity = scrollY.interpolate({
    inputRange: [SCROLL_RANGE - 20, SCROLL_RANGE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Imagotipo de "tirar para recargar": queda detrás de la lista y asoma en el hueco */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pull,
          { top: listTop + 8 },
          {
            opacity: refreshing
              ? 1
              : scrollY.interpolate({
                  inputRange: [-PULL_TRIGGER, -16],
                  outputRange: [1, 0],
                  extrapolate: 'clamp',
                }),
          },
        ]}
      >
        <Imagotipo height={36} />
      </Animated.View>

      {/* Primera carga al abrir la app: el imagotipo en el centro */}
      {loading && (
        <View pointerEvents="none" style={styles.firstLoad}>
          <Imagotipo height={72} />
          <Text style={styles.firstLoadText}>Buscando conciertos…</Text>
        </View>
      )}

      <Animated.FlatList
        ref={listRef}
        onScrollEndDrag={onScrollEndDrag}
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
          loadingMore ? <ActivityIndicator color={theme.accent} style={styles.more} /> : undefined
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        contentContainerStyle={{
          paddingTop: listTop + (refreshing ? REFRESH_SPACE : 0),
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
                  <Text style={styles.date}>
                    {item.visibility === 'private' && (
                      <Ionicons name="lock-closed" size={11} color={COLORS.muted} />
                    )}
                    {item.visibility === 'private' ? ' ' : ''}
                    {item.date}
                  </Text>
                  <Text style={styles.artist} numberOfLines={2}>
                    {item.artist}
                  </Text>
                  <Text style={styles.venue} numberOfLines={1}>
                    {item.venue}
                  </Text>
                  {/* Si puedes ir según tus turnos (solo con turnos configurados) */}
                  <AvailabilityPill availability={availability(item)} style={styles.availability} />
                  {count > 0 && (
                    <Text style={styles.going}>
                      {count} {count === 1 ? 'persona va' : 'personas van'}
                    </Text>
                  )}
                </View>
                {/* Corazón (lista de deseos) junto a "¡Voy!" */}
                <View style={styles.cardActions}>
                  <WishButton concert={item} />
                  <GoButton isGoing={going} onPress={() => toggleGoing(item)} />
                </View>
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
            Eventos
            <Text style={{ color: theme.accent }}>.</Text>
          </Animated.Text>
          {/* Buscar (ya no es pestaña: en la barra solo caben 5) */}
          <Pressable
            onPress={() => router.push('/buscar')}
            hitSlop={10}
            style={styles.searchButton}
            accessibilityRole="button"
            accessibilityLabel="Buscar conciertos"
          >
            <Ionicons name="search" size={24} color={COLORS.text} />
          </Pressable>
        </Animated.View>


        <View style={styles.tools} onLayout={(e) => setToolsHeight(e.nativeEvent.layout.height)}>
          {concerts.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.toolbarScroll}
              contentContainerStyle={styles.toolbar}
            >
              {/* Todos: sin filtros ni fechas. Si había días del calendario, se vacía
                  también lo cargado para ellos, como con "Quitar fechas" */}
              <Chip
                label="Todos"
                active={!isFiltered}
                onPress={() => {
                  if (filters.dates && !quick) trimConcerts();
                  resetFilters();
                }}
              />
              <Chip
                icon="options-outline"
                label={filterCount > 0 ? `Filtros · ${filterCount}` : 'Filtros'}
                active={filterCount > 0}
                onPress={() => router.push('/filters')}
              />
              {/* DayStage: solo conciertos a los que puedes ir (libre, o antes o tras tu turno) */}
              {hasShifts && (
                <Chip
                  icon="sunny-outline"
                  label="Mis días libres"
                  active={filters.freeDaysOnly}
                  onPress={() => setFilters((f) => ({ ...f, freeDaysOnly: !f.freeDaysOnly }))}
                />
              )}
              {/* Atajos de fechas (otra vez, se quitan); para otros días, el calendario */}
              {QUICK_DATES.map((q) => (
                <Chip
                  key={q.key}
                  label={q.label}
                  active={quick === q.key}
                  onPress={() =>
                    setFilters((f) => ({
                      ...f,
                      dates: quick === q.key ? null : quickRange(q.key, today),
                    }))
                  }
                />
              ))}
              {/* Muchos son turistas: buscan sus días en Barcelona */}
              <Chip
                icon="calendar-outline"
                label={filters.dates && !quick ? dateRangeLabel(filters.dates) : 'Calendario'}
                active={filters.dates != null && !quick}
                onPress={() => router.push('/calendar')}
              />
            </ScrollView>
          )}
        </View>

        <Animated.View style={[styles.line, { opacity: lineOpacity }]} />
      </Animated.View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
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
    searchButton: {
      position: 'absolute',
      right: 16,
      top: 0,
      bottom: 0,
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Título como el de las demás pestañas (ScreenTitle)
    logo: {
      color: COLORS.text,
      fontWeight: '700',
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
    pull: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    firstLoad: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    },
    firstLoadText: { color: COLORS.muted, fontSize: 15, fontWeight: '500' },
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
    link: { color: theme.accent, fontSize: 15, fontWeight: '700', paddingHorizontal: 20 },
    card: { marginBottom: 32 },
    cardBody: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 12,
    },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    date: {
      color: theme.accent,
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
    availability: { marginTop: 6 },
    venue: { color: COLORS.muted, fontSize: 15, marginTop: 2 },
    going: { color: COLORS.muted, fontSize: 13, marginTop: 10 },
  });
