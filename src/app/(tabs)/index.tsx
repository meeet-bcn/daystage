import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvailabilityPill } from '@/components/availability-pill';
import { CollapsibleSection } from '@/components/collapsible-section';
import { ConcertImage } from '@/components/concert-image';
import { ExportButtons } from '@/components/export-buttons';
import { MonthReportCard } from '@/components/month-report-card';
import { ScreenHeader } from '@/components/screen-header';
import { ShiftBadge } from '@/components/shift-badge';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { canGo, concertsByDate, hasSchedule, plansInMonth } from '@/data/concert-shifts';
import type { Concert } from '@/data/concerts';
import {
  formatDay,
  formatMonth,
  formatShiftTime,
  monthGrid,
  MONTHS,
  shiftHours,
  shortTime,
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
  // Sin tipos ni turnos (instalación nueva): se invita a añadir el primero
  const empty = plan.types.length === 0 && !hasSchedule(plan);
  const { concerts, availability, plans, isGoing } = useApp();
  const byDate = useMemo(() => concertsByDate(concerts), [concerts]);
  // Tus planes ("¡Voy!", también los pasados) por día, para verlos en el mes
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
                    {type && !type.off ? (
                      // Como en un cuadrante: hora de entrada y, debajo, de salida
                      <View style={styles.times}>
                        <Text
                          style={[styles.timeStart, { color: shiftColor(type.color).ink }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {shortTime(type.start)}
                        </Text>
                        <Text
                          style={[styles.timeEnd, { color: shiftColor(type.color).ink }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {shortTime(type.end)}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[styles.abbr, { color: type ? shiftColor(type.color).ink : COLORS.muted }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {type ? type.abbr : ''}
                      </Text>
                    )}
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
        {empty && (
          // Instalación nueva: sin turnos todavía
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={34} color={theme.accent} />
            <Text style={styles.emptyTitle}>Añade tu primer turno</Text>
            <Text style={styles.emptyText}>Crea tus tipos de turno o importa tu horario.</Text>
            <Pressable style={styles.button} onPress={() => router.push('/shift-type')}>
              <Text style={styles.buttonText}>Añadir turno</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/shift-import')} hitSlop={8}>
              <Text style={styles.edit}>Importar turnos</Text>
            </Pressable>
          </View>
        )}

        {/* Leyenda: turno · tus planes · conciertos que te encajan */}
        {!empty && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendShift} />
            <Text style={styles.legendText}>Turno</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendPlan} />
            <Text style={styles.legendText}>Vas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Conciertos que te encajan</Text>
          </View>
        </View>
        )}

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

        {!empty && (
        <>
        {/* Informe del mes que se ve (plegable) y exportar */}
        <CollapsibleSection id="informe" title={`Informe de ${MONTHS[month.month - 1]}`}>
          <MonthReportCard year={month.year} month={month.month} />
          <ExportButtons year={month.year} month={month.month} />
        </CollapsibleSection>

        {/* Tipos de turno: plegado por defecto (hay mucha información) */}
        <CollapsibleSection
          id="tipos"
          title="Tipos de turno"
          defaultOpen={false}
          actions={
              <View style={styles.sectionActions}>
                <Pressable onPress={() => router.push('/shift-import')} hitSlop={8}>
                  <Text style={styles.edit}>Importar</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/shift-types')} hitSlop={8}>
                  <Text style={styles.edit}>Editar</Text>
                </Pressable>
              </View>
          }
        >
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
        </CollapsibleSection>

        {/* La rotación, al final */}
        <CollapsibleSection id="rotacion" title="Rotación">
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
        </CollapsibleSection>
        </>
        )}
      </Animated.ScrollView>

      <ScreenHeader title="Calendario" scrollY={scrollY} onHeight={setHeaderHeight} />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    empty: { alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 28 },
    emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 },
    emptyText: { color: COLORS.muted, fontSize: 15, textAlign: 'center', marginBottom: 6 },
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
    // Minimalista: los días libres sin fondo; solo los turnos llevan color
    day: {
      flex: 1,
      aspectRatio: 0.6,
      borderRadius: 12,
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
    abbr: { fontSize: 15, lineHeight: 18, fontWeight: '800', marginTop: 1, paddingHorizontal: 2 },
    times: { alignItems: 'center', marginTop: 1, paddingHorizontal: 2 },
    timeStart: { fontSize: 13, lineHeight: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
    timeEnd: { fontSize: 10, lineHeight: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
    sectionActions: { flexDirection: 'row', gap: 18 },
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
      paddingVertical: 4,
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
