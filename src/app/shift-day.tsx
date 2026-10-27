import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShiftBadge } from '@/components/shift-badge';
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

/** Hoja de un día del calendario: cambiar su turno o volver al de la rotación. */
export default function ShiftDaySheet() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date: string }>();
  const date = params.date && isDateKey(params.date) ? params.date : toDateKey();
  const { plan, setOverride, clearOverride } = useShifts();

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
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]} collapsable={false}>
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
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 28 },
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
