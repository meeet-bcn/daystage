import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/data/app-context';
import { formatEuros, formatHours, monthReport, weekLabel } from '@/data/reports';
import { useShifts } from '@/data/shifts-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, SHIFT_COLORS, Theme } from '@/theme';

const CHART_HEIGHT = 96;

/**
 * Informe del mes en Turnos (como SuperShift): horas, días de trabajo, horas
 * extra sobre tu jornada y, con tarifa, lo que ganas; reparto de mañanas,
 * tardes, noches y vacaciones, y una barra por semana.
 */
export function MonthReportCard({ year, month }: { year: number; month: number }) {
  const styles = useThemedStyles(makeStyles);
  const { plan } = useShifts();
  const { settings } = useApp();
  const r = monthReport(plan, year, month, {
    dailyHours: settings.workdayHours,
    hourlyRate: settings.hourlyRate,
  });
  if (r.workDays === 0 && r.vacationDays === 0) return null;

  const maxWeek = Math.max(...r.weeks.map((w) => w.hours), 1);
  const tiles = [
    { label: 'Horas', value: formatHours(r.hours) },
    { label: 'Días de trabajo', value: String(r.workDays) },
    { label: `Extra (jornada ${String(settings.workdayHours).replace('.', ',')} h)`, value: formatHours(r.overtime) },
    r.earnings != null
      ? { label: 'Ganancias', value: formatEuros(r.earnings) }
      : { label: 'Libres', value: String(r.freeDays + r.vacationDays) },
  ];
  const kinds = [
    { label: 'Mañanas', count: r.mornings, color: SHIFT_COLORS.verde },
    { label: 'Tardes', count: r.afternoons, color: SHIFT_COLORS.rojo },
    { label: 'Noches', count: r.nights, color: SHIFT_COLORS.indigo },
    { label: 'Vacaciones', count: r.vacationDays, color: SHIFT_COLORS.sol },
  ].filter((k) => k.count > 0);

  return (
    <View style={styles.card}>
      <View style={styles.tiles}>
        {tiles.map((t) => (
          <View key={t.label} style={styles.tile}>
            <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
              {t.value}
            </Text>
            <Text style={styles.tileLabel} numberOfLines={2}>
              {t.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.kinds}>
        {kinds.map((k) => (
          <View key={k.label} style={[styles.kind, { backgroundColor: k.color.fill }]}>
            <Text style={[styles.kindText, { color: k.color.ink }]}>
              {k.count} {k.label.toLowerCase()}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.chartTitle}>Horas por semana</Text>
      <View style={styles.chart}>
        {r.weeks.map((w) => (
          <View key={w.start} style={styles.bar}>
            <Text style={styles.barValue}>{w.hours > 0 ? String(w.hours).replace('.', ',') : ''}</Text>
            <View style={[styles.barFill, { height: Math.max(3, (w.hours / maxWeek) * CHART_HEIGHT) }]} />
            <Text style={styles.barLabel}>{weekLabel(w.start)}</Text>
          </View>
        ))}
      </View>

      {r.earnings == null && (
        <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
          <Text style={styles.hint}>Pon tu tarifa por hora en Ajustes › Turnos para ver lo que ganas.</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: { marginHorizontal: 20, gap: 14 },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tile: {
      flexBasis: '47%',
      flexGrow: 1,
      padding: 12,
      borderRadius: 14,
      backgroundColor: COLORS.mist,
    },
    tileValue: { color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    tileLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
    kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    kind: { height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: 'center' },
    kindText: { fontSize: 13, fontWeight: '700' },
    chartTitle: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: CHART_HEIGHT + 40 },
    bar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    barValue: { color: COLORS.text, fontSize: 11, fontWeight: '700', marginBottom: 3 },
    barFill: { width: '70%', borderRadius: 6, backgroundColor: theme.accent },
    barLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600', marginTop: 4 },
    hint: { color: theme.accent, fontSize: 13, fontWeight: '600' },
  });
