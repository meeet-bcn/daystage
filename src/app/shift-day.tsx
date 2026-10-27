import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvailabilityPill } from '@/components/availability-pill';
import { ShiftBadge } from '@/components/shift-badge';
import { useApp } from '@/data/app-context';
import { concertsByDate, effectiveStart } from '@/data/concert-shifts';
import {
  formatDay,
  formatShiftTime,
  isDateKey,
  shiftForDate,
  type ShiftType,
  toDateKey,
} from '@/data/shifts';
import { useShifts } from '@/data/shifts-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

// "viernes, 30 de octubre" → "Viernes, 30 de octubre" (textTransform pondría mayúscula a cada palabra)
const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

/**
 * Hoja de un día del calendario: cambiar su turno o volver al de la rotación,
 * y los conciertos cargados de ese día con si puedes ir.
 */
export default function ShiftDaySheet() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date: string }>();
  const date = params.date && isDateKey(params.date) ? params.date : toDateKey();
  const { plan, setOverride, clearOverride } = useShifts();
  const { concerts, availability } = useApp();
  const dayConcerts = concertsByDate(concerts)[date] ?? [];

  const openConcert = (id: string) => {
    // Primero se cierra la hoja: la ficha va en la pila de debajo
    router.back();
    router.push({ pathname: '/concert/[id]', params: { id } });
  };

  const fromRotation = shiftForDate(date, plan.rotation);
  const current = shiftForDate(date, plan.rotation, plan.overrides);
  const changed = date in plan.overrides;
  const rotationType = plan.types.find((t) => t.id === fromRotation) ?? null;

  const choose = (id: string | null) => {
    // Elegir lo mismo que dice la rotación es volver a ella
    if (id === fromRotation && plan.rotation) clearOverride(date);
    else setOverride(date, id);
    router.back();
  };

  const option = (type: ShiftType | null) => {
    const id = type?.id ?? null;
    const selected = current === id;
    return (
      <Pressable
        key={id ?? 'libre'}
        onPress={() => choose(id)}
        style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <ShiftBadge type={type} />
        <View style={styles.optionText}>
          <Text style={styles.optionName}>{type ? type.name : 'Libre'}</Text>
          {type && <Text style={styles.optionTime}>{formatShiftTime(type)}</Text>}
        </View>
        {selected && <Ionicons name="checkmark" size={22} color={theme.accent} />}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* En una formSheet el primer hijo no puede ser (ni contener) el ScrollView: si no, no se pinta */}
      <View collapsable={false} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{capitalize(formatDay(date))}</Text>
        <Text style={styles.subtitle}>
          {plan.rotation
            ? `Según tu rotación: ${rotationType ? `${rotationType.name} (${formatShiftTime(rotationType)})` : 'libre'}`
            : 'Aún no tienes rotación: elige el turno de este día'}
          {changed ? ' · Cambiado' : ''}
        </Text>

        <View style={styles.options}>
          {plan.types.map((t) => option(t))}
          {option(null)}
        </View>

        {changed && (
          <Pressable
            style={({ pressed }) => [styles.reset, pressed && styles.pressed]}
            onPress={() => {
              clearOverride(date);
              router.back();
            }}
          >
            <Ionicons name="refresh" size={18} color={theme.accent} />
            <Text style={styles.resetText}>
              {plan.rotation ? 'Volver a la rotación' : 'Quitar el cambio'}
            </Text>
          </Pressable>
        )}

        {dayConcerts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {dayConcerts.length === 1 ? 'Un concierto este día' : `${dayConcerts.length} conciertos este día`}
            </Text>
            <View style={styles.concerts}>
              {dayConcerts.map((c, i) => (
                <Pressable
                  key={c.id}
                  onPress={() => openConcert(c.id)}
                  style={({ pressed }) => [styles.concert, i > 0 && styles.concertLine, pressed && styles.pressed]}
                >
                  <Text style={styles.concertTime}>
                    {/* Sin hora, las fuentes dejan las 00:00 */}
                    {effectiveStart(c.startsAt!) === c.startsAt
                      ? new Date(c.startsAt!).toTimeString().slice(0, 5)
                      : '—'}
                  </Text>
                  <View style={styles.concertText}>
                    <Text style={styles.concertArtist} numberOfLines={1}>
                      {c.artist}
                    </Text>
                    <Text style={styles.concertVenue} numberOfLines={1}>
                      {c.venue}
                    </Text>
                    <AvailabilityPill availability={availability(c)} style={styles.concertPill} />
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { paddingHorizontal: 20, paddingTop: 28 },
    sectionTitle: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 28,
      marginBottom: 8,
    },
    concerts: { borderRadius: 16, backgroundColor: COLORS.surface, overflow: 'hidden' },
    concert: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    concertLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
    concertTime: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      width: 48,
    },
    concertText: { flex: 1 },
    concertArtist: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    concertVenue: { color: COLORS.muted, fontSize: 13, marginTop: 1 },
    concertPill: { marginTop: 6 },
    title: {
      color: COLORS.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
    options: { marginTop: 20, gap: 8 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: 56,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: COLORS.surface,
    },
    optionSelected: { backgroundColor: theme.accentSoft },
    optionText: { flex: 1 },
    optionName: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    optionTime: { color: COLORS.muted, fontSize: 13, marginTop: 1, fontVariant: ['tabular-nums'] },
    pressed: { opacity: 0.6 },
    reset: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 46,
      marginTop: 16,
      borderRadius: 23,
      backgroundColor: theme.accentSoft,
    },
    resetText: { color: theme.accent, fontSize: 16, fontWeight: '700' },
  });
