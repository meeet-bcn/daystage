import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavHeader } from '@/components/nav-header';
import { ShiftBadge } from '@/components/shift-badge';
import {
  addDays,
  formatDay,
  newId,
  shiftForDate,
  templateCycle,
  toDateKey,
  WEEKDAY_INITIALS,
  weekdayIndex,
} from '@/data/shifts';
import { useShifts } from '@/data/shifts-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

const PREVIEW_DAYS = 14;

/** Asistente de rotación: fecha de inicio y secuencia de días que se repite. */
export default function RotationScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { plan, setRotation } = useShifts();
  const current = plan.rotation;

  const [name, setName] = useState(current?.name ?? 'Mi rotación');
  const [startDate, setStartDate] = useState(current?.startDate ?? toDateKey());
  const [cycle, setCycle] = useState<(string | null)[]>(current?.cycle ?? []);

  const typeOf = (id: string | null) => plan.types.find((t) => t.id === id) ?? null;
  // La plantilla usa Mañana, Tarde y Noche; si los borraste, tus tres primeros tipos
  const byId = (id: string, i: number) =>
    plan.types.find((t) => t.id === id)?.id ?? plan.types[i]?.id ?? null;
  const canTemplate = plan.types.length >= 3 || ['manana', 'tarde', 'noche'].every((id) => typeOf(id));
  const applyTemplate = () =>
    setCycle(templateCycle(byId('manana', 0)!, byId('tarde', 1)!, byId('noche', 2)!));

  const save = () => {
    if (cycle.length === 0) return;
    setRotation({ id: current?.id ?? newId('rotacion'), name: name.trim() || 'Mi rotación', startDate, cycle });
    router.back();
  };

  const remove = () =>
    Alert.alert('¿Quitar la rotación?', 'El calendario quedará libre salvo los días que hayas cambiado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          setRotation(null);
          router.back();
        },
      },
    ]);

  const draft = { id: 'borrador', name, startDate, cycle };
  const preview = Array.from({ length: PREVIEW_DAYS }, (_, i) => addDays(startDate, i));

  return (
    <View style={styles.container}>
      <NavHeader
        title="Rotación"
        right={
          <Pressable onPress={save} disabled={cycle.length === 0} hitSlop={8}>
            <Text style={[styles.save, cycle.length === 0 && styles.disabled]}>Guardar</Text>
          </Pressable>
        }
      />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
      >
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Mi rotación"
          placeholderTextColor={COLORS.muted}
          maxLength={32}
        />

        <Text style={styles.label}>Empieza el</Text>
        <View style={styles.dateRow}>
          <Pressable
            onPress={() => setStartDate((d) => addDays(d, -1))}
            hitSlop={8}
            style={styles.dateArrow}
            accessibilityLabel="Día anterior"
          >
            <Ionicons name="chevron-back" size={22} color={theme.accent} />
          </Pressable>
          <Text style={styles.date}>{formatDay(startDate)}</Text>
          <Pressable
            onPress={() => setStartDate((d) => addDays(d, 1))}
            hitSlop={8}
            style={styles.dateArrow}
            accessibilityLabel="Día siguiente"
          >
            <Ionicons name="chevron-forward" size={22} color={theme.accent} />
          </Pressable>
        </View>
        <Text style={styles.help}>El primer día de la secuencia cae en esta fecha.</Text>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Secuencia · {cycle.length} días</Text>
          {canTemplate && (
            <Pressable onPress={applyTemplate} hitSlop={8}>
              <Text style={styles.link}>Plantilla 2M-2T-2N-4L</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.sequence}>
          {cycle.length === 0 ? (
            <Text style={styles.help}>
              Toca los turnos de abajo en orden, un toque por día. Toca un día de la secuencia para
              quitarlo.
            </Text>
          ) : (
            cycle.map((id, i) => (
              <Pressable
                key={i}
                onPress={() => setCycle((c) => c.filter((_, j) => j !== i))}
                accessibilityLabel={`Día ${i + 1}: ${typeOf(id)?.name ?? 'libre'}. Toca para quitarlo`}
                style={styles.step}
              >
                <ShiftBadge type={typeOf(id)} />
                <Text style={styles.stepNumber}>{i + 1}</Text>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.palette}>
          {plan.types.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setCycle((c) => [...c, t.id])}
              style={({ pressed }) => [styles.add, pressed && styles.pressed]}
            >
              <ShiftBadge type={t} size="small" />
              <Text style={styles.addText}>{t.name}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setCycle((c) => [...c, null])}
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}
          >
            <ShiftBadge type={null} size="small" />
            <Text style={styles.addText}>Libre</Text>
          </Pressable>
        </View>
        {cycle.length > 0 && (
          <View style={styles.actions}>
            <Pressable onPress={() => setCycle((c) => c.slice(0, -1))} hitSlop={8}>
              <Text style={styles.link}>Quitar el último</Text>
            </Pressable>
            <Pressable onPress={() => setCycle([])} hitSlop={8}>
              <Text style={styles.link}>Vaciar</Text>
            </Pressable>
          </View>
        )}

        {cycle.length > 0 && (
          <>
            <Text style={styles.label}>Así quedan las próximas dos semanas</Text>
            <View style={styles.preview}>
              {preview.map((date) => (
                <View key={date} style={styles.previewDay}>
                  <Text style={styles.previewWeekday}>{WEEKDAY_INITIALS[weekdayIndex(date)]}</Text>
                  <Text style={styles.previewNumber}>{Number(date.slice(8))}</Text>
                  <ShiftBadge type={typeOf(shiftForDate(date, draft))} size="small" />
                </View>
              ))}
            </View>
          </>
        )}

        {current && (
          <Pressable style={({ pressed }) => [styles.delete, pressed && styles.pressed]} onPress={remove}>
            <Text style={styles.deleteText}>Quitar rotación</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    save: { color: theme.accent, fontSize: 16, fontWeight: '700' },
    disabled: { opacity: 0.4 },
    label: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 8,
    },
    labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    link: { color: theme.accent, fontSize: 14, fontWeight: '700' },
    input: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      fontSize: 17,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
    },
    dateArrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    date: { flex: 1, textAlign: 'center', color: COLORS.text, fontSize: 16, fontWeight: '600' },
    help: { color: COLORS.muted, fontSize: 13, lineHeight: 18, marginTop: 6 },
    sequence: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      minHeight: 64,
      padding: 12,
      borderRadius: 16,
      backgroundColor: COLORS.mist,
    },
    step: { alignItems: 'center', gap: 2 },
    stepNumber: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
    palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    add: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 40,
      paddingLeft: 8,
      paddingRight: 14,
      borderRadius: 20,
      backgroundColor: COLORS.surface,
    },
    addText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 24, marginTop: 14 },
    pressed: { opacity: 0.6 },
    preview: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
    previewDay: { width: `${100 / 7}%`, alignItems: 'center', gap: 2 },
    previewWeekday: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
    previewNumber: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
    delete: {
      height: 46,
      marginTop: 32,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.surface,
    },
    deleteText: { color: COLORS.danger, fontSize: 16, fontWeight: '700' },
  });
