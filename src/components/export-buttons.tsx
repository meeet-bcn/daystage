import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/data/app-context';
import { mealTickets } from '@/data/meal-tickets';
import { monthReport } from '@/data/reports';
import { shareMonthPdf, syncToCalendar } from '@/data/shift-export-service';
import { useShifts } from '@/data/shifts-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import type { Theme } from '@/theme';

/** Turnos: copiar al calendario del iPhone y compartir el PDF del mes que se ve. */
export function ExportButtons({ year, month }: { year: number; month: number }) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const { plan } = useShifts();
  const { settings } = useApp();
  const [busy, setBusy] = useState<'calendar' | 'pdf' | null>(null);

  const toCalendar = async () => {
    setBusy('calendar');
    try {
      const result = await syncToCalendar(plan);
      if (result.ok) {
        Alert.alert(
          'Turnos en tu calendario',
          `${result.events} turnos en el calendario «DayStage» (de la semana pasada a los próximos 3 meses). Vuelve a tocar aquí cuando cambien.`
        );
      } else if (result.reason === 'denied') {
        Alert.alert('Sin acceso al calendario', 'Permite a DayStage usar el calendario desde los ajustes del iPhone.');
      } else {
        Alert.alert(
          'Aún no disponible aquí',
          'El calendario del iPhone necesita la app instalada (no funciona en Expo Go). El PDF sí.'
        );
      }
    } catch {
      Alert.alert('No se pudo copiar', 'Inténtalo otra vez.');
    } finally {
      setBusy(null);
    }
  };

  const toPdf = async () => {
    setBusy('pdf');
    try {
      const report = monthReport(plan, year, month, {
        dailyHours: settings.workdayHours,
        hourlyRate: settings.hourlyRate,
      });
      const ticket = settings.mealTicket;
      const tickets =
        ticket.enabled && ticket.amount != null
          ? mealTickets(plan, year, month, { minHours: ticket.minHours, amount: ticket.amount })
          : null;
      await shareMonthPdf(plan, year, month, report, tickets);
    } catch {
      Alert.alert('No se pudo crear el PDF', 'Inténtalo otra vez.');
    } finally {
      setBusy(null);
    }
  };

  const button = (key: 'calendar' | 'pdf', icon: 'calendar-outline' | 'document-outline', label: string, onPress: () => void) => (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
      disabled={busy != null}
      accessibilityRole="button"
    >
      {busy === key ? (
        <ActivityIndicator color={theme.accent} />
      ) : (
        <Ionicons name={icon} size={18} color={theme.accent} />
      )}
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      {button('calendar', 'calendar-outline', 'Al calendario', toCalendar)}
      {button('pdf', 'document-outline', 'PDF del mes', toPdf)}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 12 },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.accentSoft,
    },
    pressed: { opacity: 0.7 },
    text: { color: theme.accent, fontSize: 15, fontWeight: '700' },
  });
