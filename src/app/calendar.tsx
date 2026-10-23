import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/data/app-context';
import { dateRangeLabel, dayStart, pickDay } from '@/data/filters';
import { COLORS } from '@/theme';

// Ajustes del calendario
const MONTHS_AHEAD = 12; // Ticketmaster publica conciertos hasta con un año de antelación
const DAY_SIZE = 40;
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']; // en España la semana empieza en lunes

/** "Octubre de 2026": solo la primera letra en mayúscula (capitalize pondría "De"). */
function monthLabel(year: number, month: number) {
  const label = new Date(year, month, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Días del mes en filas de 7 (lunes a domingo); null en los huecos. */
function monthWeeks(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1).getTime()),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

export default function CalendarSheet() {
  const insets = useSafeAreaInsets();
  const {
    filters,
    setFilters,
    concerts,
    visibleConcerts,
    hasMore,
    loadMore,
    loadingMore,
    loadedUntil,
    trimConcerts,
  } = useApp();
  const range = filters.dates;
  // La fecha de hoy se fija al abrir la hoja (leerla en cada render no es puro)
  const [now] = useState(() => new Date());
  const today = dayStart(now.getTime());
  const count = visibleConcerts.length;

  // Días con algún concierto ya cargado: un punto debajo del número
  const concertDays = new Set(
    concerts.filter((c) => c.startsAt != null).map((c) => dayStart(c.startsAt as number))
  );

  const months = Array.from({ length: MONTHS_AHEAD }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Al bajar por los meses se piden más conciertos, para que salgan sus puntos:
  // si el último mes a la vista acaba después del último concierto cargado
  const monthTops = useRef<number[]>([]);
  const monthsTop = useRef(0); // los meses empiezan bajo la cabecera
  const viewport = useRef({ offset: 0, height: 0 });
  const checkLoad = () => {
    const { offset, height } = viewport.current;
    const lastVisible = monthTops.current.findLastIndex(
      (top) => monthsTop.current + top < offset + height
    );
    if (lastVisible < 0 || !hasMore) return;
    const { year, month } = months[lastVisible];
    const monthEnd = new Date(year, month + 1, 1).getTime();
    if ((loadedUntil ?? 0) < monthEnd) loadMore();
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    viewport.current.offset = e.nativeEvent.contentOffset.y;
    checkLoad();
  };
  // Cuando llega una página, si aún no cubre los meses a la vista, se pide otra
  useEffect(checkLoad, [loadedUntil]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearDates = () => {
    setFilters((f) => ({ ...f, dates: null }));
    // Sin fechas sobran las páginas pedidas para el calendario: se vacía la caché
    trimConcerts();
  };

  return (
    <View style={styles.container}>
      {/* La hoja (formSheet) trata aparte su primer hijo nativo: si es la lista, iOS
          no la pinta. Esta View vacía va delante para que no lo sea (collapsable={false}
          para que React Native no la elimine al aplanar la jerarquía) */}
      <View collapsable={false} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={100}
        onLayout={(e) => {
          viewport.current.height = e.nativeEvent.layout.height;
          checkLoad();
        }}
      >
        {/* Cabecera fija de cristal (stickyHeaderIndices): blanco translúcido con
              desenfoque sobre los meses que pasan por debajo. Una capa superpuesta con
              position absolute no sirve en la hoja: iOS deja de pintar los meses */}
        <View style={styles.top}>
          <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.glass]} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Calendario</Text>
              <View style={styles.subtitleRow}>
                <Text style={styles.subtitle}>
                  {range ? dateRangeLabel(range) : '¿Qué días estás en Barcelona?'}
                </Text>
                {loadingMore && <ActivityIndicator size="small" color={COLORS.accent} />}
              </View>
            </View>
            {range ? (
              <Pressable onPress={clearDates} hitSlop={8}>
                <Text style={styles.reset}>Quitar fechas</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.weekdays}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>
        </View>

        <View
          style={styles.months}
          onLayout={(e) => {
            monthsTop.current = e.nativeEvent.layout.y;
          }}
        >
          {months.map(({ year, month }, index) => (
            <View
              key={`${year}-${month}`}
              style={styles.month}
              onLayout={(e) => {
                monthTops.current[index] = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.monthTitle}>{monthLabel(year, month)}</Text>
              {monthWeeks(year, month).map((week, i) => (
                <View key={i} style={styles.week}>
                  {week.map((day, j) => {
                    if (day == null) return <View key={j} style={styles.cell} />;
                    const past = day < today;
                    const isEdge = range != null && (day === range.from || day === range.to);
                    const inside = range != null && day > range.from && day < range.to;
                    // Franja de fondo entre el primer y el último día
                    const bandLeft = range != null && day > range.from && day <= range.to;
                    const bandRight = range != null && day >= range.from && day < range.to;
                    return (
                      <Pressable
                        key={j}
                        style={styles.cell}
                        disabled={past}
                        onPress={() => setFilters((f) => ({ ...f, dates: pickDay(f.dates, day) }))}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isEdge || inside, disabled: past }}
                        accessibilityLabel={new Date(day).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      >
                        {bandLeft && <View style={[styles.band, styles.bandLeft]} />}
                        {bandRight && <View style={[styles.band, styles.bandRight]} />}
                        <View style={[styles.day, isEdge && styles.dayEdge]}>
                          <Text
                            style={[
                              styles.dayText,
                              day === today && styles.todayText,
                              past && styles.pastText,
                              isEdge && styles.edgeText,
                            ]}
                          >
                            {new Date(day).getDate()}
                          </Text>
                        </View>
                        {concertDays.has(day) && !past && (
                          <View style={[styles.dot, isEdge && styles.dotEdge]} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.apply} onPress={() => router.back()}>
          <Text style={styles.applyText}>
            {count === 0 && !hasMore
              ? 'Ningún concierto esos días'
              : `Ver ${count}${hasMore ? '+' : ''} ${count === 1 && !hasMore ? 'concierto' : 'conciertos'}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  top: { overflow: 'hidden' },
  glass: { backgroundColor: 'rgba(255,255,255,0.6)' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  subtitle: { color: COLORS.muted, fontSize: 15 },
  reset: { color: COLORS.accent, fontSize: 15, fontWeight: '700', marginTop: 8 },
  weekdays: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  weekday: { flex: 1, textAlign: 'center', color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  months: { paddingHorizontal: 20 },
  month: { marginTop: 20 },
  monthTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  week: { flexDirection: 'row' },
  cell: { flex: 1, height: DAY_SIZE + 6, alignItems: 'center', justifyContent: 'center' },
  band: {
    position: 'absolute',
    top: 3,
    height: DAY_SIZE,
    width: '50%',
    backgroundColor: COLORS.accentSoft,
  },
  bandLeft: { left: 0 },
  bandRight: { right: 0 },
  day: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayEdge: { backgroundColor: COLORS.accent },
  dayText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  todayText: { color: COLORS.accent, fontWeight: '800' },
  pastText: { color: COLORS.line },
  edgeText: { color: COLORS.white, fontWeight: '800' },
  dot: {
    position: 'absolute',
    bottom: 7,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  dotEdge: { backgroundColor: COLORS.white },
  footer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.line,
  },
  apply: {
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
});
