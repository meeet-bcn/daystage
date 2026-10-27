import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { NavHeader } from '@/components/nav-header';
import { CALENDAR_SECTIONS } from '@/data/calendar-sections';
import { setCalendarSection, useCalendarSections } from '@/hooks/use-calendar-sections';
import { useTheme } from '@/hooks/use-theme';
import { COLORS } from '@/theme';

const MANAGE = [
  { label: 'Tipos de turno', href: '/shift-types' },
  { label: 'Rotación', href: '/rotation' },
  { label: 'Importar turnos', href: '/shift-import' },
] as const;

/** Calendario › Editar: qué se ve bajo el mes, y tus turnos. */
export default function CalendarSectionsScreen() {
  const theme = useTheme();
  const sections = useCalendarSections();
  return (
    <View style={styles.container}>
      <NavHeader title="Editar calendario" />
      <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={styles.content}>
        <Text style={styles.hint}>El mes siempre se ve. Elige qué más quieres debajo.</Text>
        <View style={styles.list}>
          {CALENDAR_SECTIONS.map(({ key, label }, i) => (
            <View key={key} style={[styles.row, i > 0 && styles.rowLine]}>
              <Text style={styles.label}>{label}</Text>
              <Switch
                value={sections[key]}
                onValueChange={(v) => setCalendarSection(key, v)}
                trackColor={{ true: theme.accent, false: COLORS.line }}
              />
            </View>
          ))}
        </View>

        <Text style={styles.group}>Tus turnos</Text>
        <View style={styles.list}>
          {MANAGE.map(({ label, href }, i) => (
            <Pressable
              key={href}
              onPress={() => router.push(href)}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowLine, pressed && styles.pressed]}
            >
              <Text style={styles.label}>{label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 12 },
  hint: { color: COLORS.muted, fontSize: 15 },
  list: { marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
  label: { color: COLORS.text, fontSize: 17 },
  group: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 20,
  },
  pressed: { opacity: 0.6 },
});
