import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvailabilityPill } from '@/components/availability-pill';
import { ConcertImage } from '@/components/concert-image';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenSubtitle } from '@/components/screen-title';
import { ShiftBadge } from '@/components/shift-badge';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { canGo, concertsByDate, plansInMonth } from '@/data/concert-shifts';
import type { Concert } from '@/data/concerts';
import {
  formatDay,
  formatMonth,
  formatShiftTime,
  monthGrid,
  shiftHours,
  toDateKey,
  typeForDate,
  WEEKDAY_INITIALS,
} from '@/data/shifts';
import { useShifts } from '@/data/shifts-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, shiftColor, Theme } from '@/theme';

export default function TurnosScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { plan } = useShifts();
  const { concerts, availability, plans, isGoing } = useApp();
  const byDate = useMemo(() => concertsByDate(concerts), [concerts]);
  // Tus planes ("Meeet In!", también los pasados) por día, para verlos en el mes
  const plansByDate = useMemo(() => concertsByDate(plans), [plans]);
  const today = toDateKey();
  const [month, setMonth] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  }));
  const grid = useMemo(() => monthGrid(month.year, month.month), [month]);
  const isCurrentMonth = today.startsWith(`${month.year}-${String(month.month).padStart(2, '0')}`);

  const moveMonth = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const index = year * 12 + (m - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  const goToday = () =>
    setMonth({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });

  const openDay = (date: string) => router.push({ pathname: '/shift-day', params: { date } });
  const openConcert = (concert: Concert) =>
    router.push({ pathname: '/concert/[id]', params: { id: concert.id } });
  const monthPlans = plansInMonth(plans, month.year, month.month);

  const scrollY = useAnimatedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const rotation = plan.rotation;

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentInsetAdjustmentBehavior="never"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ top: headerHeight }}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + BottomTabInset + 32,
        }}
      >
        <ScreenSubtitle>Tu calendario de trabajo</ScreenSubtitle>

        <View style={styles.monthRow}>
          <Pressable
            onPress={() => moveMonth(-1)}
            hitSlop={10}
            style={styles.arrow}
            accessibilityLabel="Mes anterior"
          >
            <Ionicons name="chevron-back" size={22} color={theme.accent} />
          </Pressable>
          <Pressable onPress={goToday} disabled={isCurrentMonth} style={styles.monthTitleBox}>
            <Text style={styles.monthTitle}>{formatMonth(month.year, month.month)}</Text>
            {!isCurrentMonth && <Text style={styles.todayLink}>Volver a hoy</Text>}
          </Pressable>
          <Pressable
            onPress={() => moveMonth(1)}
            hitSlop={10}
            style={styles.arrow}
            accessibilityLabel="Mes siguiente"
          >
            <Ionicons name="chevron-forward" size={22} color={theme.accent} />
          </Pressable>
        </View>

        <View style={styles.calendar}>
          <View style={styles.week}>
            {WEEKDAY_INITIALS.map((d) => (
              <Text key={d} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>
          {grid.map((week) => (
            <View key={week[0].date} style={styles.week}>
              {week.map(({ date, inMonth }) => {
                const type = typeForDate(date, plan);
                const isToday = date === today;
                const changed = date in plan.overrides;
                // Conciertos cargados ese día a los que puedes ir (libre, antes o tras el turno)
                const fits = (byDate[date] ?? []).filter(
                  (c) => !isGoing(c.id) && canGo(availability(c))
                ).length;
                const dayPlans = plansByDate[date] ?? [];
                return (
                  <Pressable
                    key={date}
                    onPress={() => openDay(date)}
                    style={({ pressed }) => [
                      styles.day,
                      type && { backgroundColor: shiftColor(type.color).fill },
                      !inMonth && styles.outside,
                      pressed && styles.pressed,
                    ]}
                    accessibilityLabel={`${formatDay(date)}: ${type ? type.name : 'libre'}${changed ? ', cambiado' : ''}${dayPlans.length > 0 ? `, vas a ${dayPlans.map((c) => c.artist).join(' y ')}` : ''}${fits > 0 ? `, ${fits} ${fits === 1 ? 'concierto' : 'conciertos'} para ti` : ''}`}
                  >
                    <View style={[styles.dayNumberBox, isToday && styles.todayBox]}>
                      <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
                        {Number(date.slice(8))}
                      </Text>
                    </View>
                    <Text
                      style={[styles.abbr, { color: type ? shiftColor(type.color).ink : COLORS.muted }]}
                      numberOfLines={1}
                    >
                      {type ? type.abbr : rotation ? 'L' : ''}
                    </Text>
                    {changed && <View style={styles.changedDot} />}
                    {dayPlans.length > 0 ? (
                      // Tu plan: la foto del concierto con el aro del acento; tocarla abre la ficha
                      // (con varios, el día abre la hoja con todos)
                      <Pressable
                        style={styles.planBadge}
                        hitSlop={6}
                        onPress={() =>
                          dayPlans.length === 1 ? openConcert(dayPlans[0]) : openDay(date)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Abrir ${dayPlans[0].artist}`}
                      >
                        <ConcertImage concert={dayPlans[0]} style={styles.planThumb} iconSize={10} />
                        {dayPlans.length > 1 && (
                          <View style={styles.planCount}>
                            <Text style={styles.planCountText}>{dayPlans.length}</Text>
                          </View>
                        )}
                      </Pressable>
                    ) : (
                      fits > 0 && <View style={styles.concertDot} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        {/* Leyenda: turno · tus planes · conciertos que te encajan */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendShift} />
            <Text style={styles.legendText}>Turno</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendPlan} />
            <Text style={styles.legendText}>Vas (Meeet In!)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Conciertos que te encajan</Text>
          </View>
        </View>
        <Text style={styles.hint}>Toca un día para cambiar su turno o ver sus conciertos.</Text>

        {monthPlans.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tus planes este mes</Text>
            <View style={[styles.card, styles.plansCard]}>
              {monthPlans.map((c, i) => (
                <Pressable
                  key={c.id}
                  onPress={() => openConcert(c)}
                  style={({ pressed }) => [styles.planRow, i > 0 && styles.planRowLine, pressed && styles.pressed]}
                >
                  <ConcertImage concert={c} style={styles.planRowThumb} iconSize={16} />
                  <View style={styles.planRowText}>
                    <Text style={styles.planRowDate}>{c.date}</Text>
                    <Text style={styles.planRowArtist} numberOfLines={1}>
                      {c.artist}
                    </Text>
                    <Text style={styles.planRowVenue} numberOfLines={1}>
                      {c.venue}
                    </Text>
                  </View>
                  <AvailabilityPill availability={availability(c)} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Rotación</Text>
        <View style={styles.card}>
          {rotation && rotation.cycle.length > 0 ? (
            <>
              <Text style={styles.cardTitle}>{rotation.name}</Text>
              <Text style={styles.cardText}>
                Ciclo de {rotation.cycle.length} días desde el {formatDay(rotation.startDate)}
              </Text>
              <View style={styles.cycle}>
                {rotation.cycle.map((id, i) => (
                  <ShiftBadge
                    key={i}
                    size="small"
                    type={plan.types.find((t) => t.id === id) ?? null}
                  />
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Aún no tienes rotación</Text>
              <Text style={styles.cardText}>
                Dinos cómo se repiten tus turnos (por ejemplo, 2 mañanas, 2 tardes, 2 noches y 4
                libres) y llenaremos el calendario por ti.
              </Text>
            </>
          )}
          <Pressable style={styles.button} onPress={() => router.push('/rotation')}>
            <Text style={styles.buttonText}>
              {rotation ? 'Cambiar rotación' : 'Crear rotación'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInline]}>Tipos de turno</Text>
          <Pressable onPress={() => router.push('/shift-types')} hitSlop={8}>
            <Text style={styles.edit}>Editar</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          {plan.types.length === 0 ? (
            <Text style={styles.cardText}>No tienes tipos de turno. Crea uno en «Editar».</Text>
          ) : (
            plan.types.map((t) => (
              <View key={t.id} style={styles.legendRow}>
                <ShiftBadge type={t} />
                <Text style={styles.legendName}>{t.name}</Text>
                <Text style={styles.legendTime}>
                  {formatShiftTime(t)} · {shiftHours(t)} h
                </Text>
              </View>
            ))
          )}
        </View>
      </Animated.ScrollView>

      <ScreenHeader title="Turnos" scrollY={scrollY} onHeight={setHeaderHeight} />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    arrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    monthTitleBox: { alignItems: 'center' },
    monthTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
    todayLink: { color: theme.accent, fontSize: 13, fontWeight: '600', marginTop: 2 },
    calendar: { paddingHorizontal: 14, gap: 4 },
    week: { flexDirection: 'row', gap: 4 },
    weekday: {
      flex: 1,
      textAlign: 'center',
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      paddingVertical: 4,
    },
    day: {
      flex: 1,
      aspectRatio: 0.6,
      borderRadius: 12,
      backgroundColor: COLORS.surface,
      alignItems: 'center',
      paddingTop: 5,
    },
    outside: { opacity: 0.35 },
    pressed: { opacity: 0.6 },
    dayNumberBox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    todayBox: { backgroundColor: theme.accent },
    dayNumber: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
    todayNumber: { color: COLORS.white, fontWeight: '800' },
    abbr: { fontSize: 15, lineHeight: 18, fontWeight: '800', marginTop: 1 },
    changedDot: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.accent,
    },
    planBadge: { marginTop: 3 },
    planThumb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.accent,
      backgroundColor: COLORS.surface,
      overflow: 'hidden',
    },
    planCount: {
      position: 'absolute',
      top: -4,
      right: -7,
      minWidth: 14,
      height: 14,
      borderRadius: 7,
      paddingHorizontal: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    planCountText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      columnGap: 16,
      rowGap: 6,
      marginTop: 12,
      marginHorizontal: 20,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
    legendShift: { width: 14, height: 14, borderRadius: 4, backgroundColor: COLORS.lavender },
    legendPlan: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: theme.accent,
      backgroundColor: COLORS.surface,
    },
    legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.text },
    plansCard: { padding: 0, gap: 0, overflow: 'hidden' },
    planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    planRowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
    planRowThumb: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden' },
    planRowText: { flex: 1 },
    planRowDate: {
      color: theme.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    planRowArtist: { color: COLORS.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
    planRowVenue: { color: COLORS.muted, fontSize: 13, marginTop: 1 },
    concertDot: {
      position: 'absolute',
      bottom: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.text,
    },
    hint: {
      color: COLORS.muted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 8,
      marginHorizontal: 24,
    },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: 20,
    },
    sectionTitle: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 28,
      marginBottom: 8,
      marginHorizontal: 24,
    },
    sectionTitleInline: { marginRight: 0 },
    edit: { color: theme.accent, fontSize: 15, fontWeight: '600', marginTop: 20 },
    card: {
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 18,
      backgroundColor: COLORS.mist,
      gap: 8,
    },
    cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
    cardText: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
    cycle: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    button: {
      marginTop: 6,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 2 },
    legendName: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '600' },
    legendTime: { color: COLORS.muted, fontSize: 14, fontVariant: ['tabular-nums'] },
  });
