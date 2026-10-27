import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AvailabilityPill } from '@/components/availability-pill';
import { ShiftBadge } from '@/components/shift-badge';
import { useApp } from '@/data/app-context';
import type { Concert } from '@/data/concerts';
import { crossesMidnight, formatShiftTime, toDateKey, typeForDate } from '@/data/shifts';
import { useShifts } from '@/data/shifts-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

/**
 * «Tu día» en la ficha del concierto (DayStage): el turno de ese día y si
 * puedes ir. Sin turnos configurados, invita a configurarlos en Turnos.
 * Tocarlo abre la hoja del día para cambiar el turno.
 */
export function YourDayCard({ concert }: { concert: Concert }) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const { availability, hasShifts } = useApp();
  const { plan } = useShifts();
  if (concert.startsAt == null) return null;

  if (!hasShifts) {
    return (
      <Pressable style={styles.card} onPress={() => router.navigate('/turnos')}>
        <Text style={styles.title}>Tu día</Text>
        <Text style={styles.text}>
          Configura tus turnos y te diremos si ese día libras, sales a tiempo o trabajas.
        </Text>
        <View style={styles.linkRow}>
          <Text style={styles.link}>Configurar en Turnos</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.accent} />
        </View>
      </Pressable>
    );
  }

  const date = toDateKey(new Date(concert.startsAt));
  const type = typeForDate(date, plan);
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/shift-day', params: { date } })}
      accessibilityHint="Abre el día en Turnos para cambiar el turno"
    >
      <View style={styles.head}>
        <Text style={styles.title}>Tu día</Text>
        <AvailabilityPill availability={availability(concert)} />
      </View>
      <View style={styles.row}>
        <ShiftBadge type={type} />
        <Text style={styles.shift}>
          {type
            ? `${type.name} · ${formatShiftTime(type)}${crossesMidnight(type) ? ' (acaba al día siguiente)' : ''}`
            : 'No trabajas ese día'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
      </View>
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: COLORS.mist, gap: 10 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
    text: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    shift: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '600' },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    link: { color: theme.accent, fontSize: 15, fontWeight: '700' },
  });
