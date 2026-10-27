import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavHeader } from '@/components/nav-header';
import { ShiftBadge } from '@/components/shift-badge';
import { formatShiftTime, shiftHours, crossesMidnight } from '@/data/shifts';
import { useShifts } from '@/data/shifts-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

/** Lista de tipos de turno (Turnos › Editar): tocar uno lo edita; "Añadir" crea otro. */
export default function ShiftTypesScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { plan } = useShifts();

  const open = (id?: string) =>
    router.push(id ? { pathname: '/shift-type', params: { id } } : '/shift-type');

  return (
    <View style={styles.container}>
      <NavHeader title="Tipos de turno" />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
      >
        <View style={styles.card}>
          {plan.types.map((t, i) => (
            <Pressable
              key={t.id}
              onPress={() => open(t.id)}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowLine, pressed && styles.pressed]}
            >
              <ShiftBadge type={t} />
              <View style={styles.rowText}>
                <Text style={styles.name}>{t.name}</Text>
                <Text style={styles.detail}>
                  {formatShiftTime(t)}
                  {crossesMidnight(t) ? ' (día siguiente)' : ''} · {shiftHours(t)} h
                  {t.breakMinutes > 0 ? ` · ${t.breakMinutes} min de descanso` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
            </Pressable>
          ))}
          {plan.types.length === 0 && (
            <Text style={styles.empty}>Aún no tienes tipos de turno.</Text>
          )}
        </View>

        <Pressable style={({ pressed }) => [styles.add, pressed && styles.pressed]} onPress={() => open()}>
          <Ionicons name="add" size={20} color={theme.accent} />
          <Text style={styles.addText}>Añadir tipo de turno</Text>
        </Pressable>
        <Text style={styles.footer}>
          Si la hora de fin es anterior a la de inicio, el turno acaba al día siguiente (como el de
          noche).
        </Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    card: { backgroundColor: COLORS.background, borderRadius: 16, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: 60,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
    rowText: { flex: 1 },
    name: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    detail: { color: COLORS.muted, fontSize: 13, marginTop: 2, fontVariant: ['tabular-nums'] },
    empty: { color: COLORS.muted, fontSize: 15, padding: 16 },
    pressed: { opacity: 0.6 },
    add: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 46,
      marginTop: 16,
      borderRadius: 23,
      backgroundColor: theme.accentSoft,
    },
    addText: { color: theme.accent, fontSize: 16, fontWeight: '700' },
    footer: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 10, marginHorizontal: 4 },
  });
