import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { NavHeader } from '@/components/nav-header';
import { ShiftBadge } from '@/components/shift-badge';
import { crossesMidnight, isTime, newId, shiftHours, type ShiftType } from '@/data/shifts';
import { useShifts } from '@/data/shifts-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, DEFAULT_SHIFT_COLOR, SHIFT_COLORS, type ShiftColor, Theme } from '@/theme';

const BREAKS = [0, 15, 30, 45, 60];

/** "630" o "6:30" → "06:30" mientras escribes; si no se entiende, tal cual. */
function normalizeTime(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (text.includes(':')) {
    const [h, m = ''] = text.split(':');
    return `${h.replace(/\D/g, '').padStart(2, '0').slice(-2)}:${m.replace(/\D/g, '').slice(0, 2)}`;
  }
  if (digits.length === 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`;
  return digits;
}

/** Crear o editar un tipo de turno (modal desde Tipos de turno). */
export default function ShiftTypeEditor() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { plan, saveType, deleteType } = useShifts();
  const existing = plan.types.find((t) => t.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [abbr, setAbbr] = useState(existing?.abbr ?? '');
  const [color, setColor] = useState<ShiftColor>(existing?.color ?? DEFAULT_SHIFT_COLOR);
  const [start, setStart] = useState(existing?.start ?? '08:00');
  const [end, setEnd] = useState(existing?.end ?? '16:00');
  const [breakMinutes, setBreakMinutes] = useState(existing?.breakMinutes ?? 0);

  const timesOk = isTime(start) && isTime(end);
  const valid = name.trim() !== '' && abbr.trim() !== '' && timesOk;
  const draft: ShiftType = {
    id: existing?.id ?? '',
    name: name.trim(),
    abbr: abbr.trim().toUpperCase(),
    color,
    start,
    end,
    breakMinutes,
  };

  const save = () => {
    if (!valid) return;
    saveType({ ...draft, id: existing?.id ?? newId('turno') });
    router.back();
  };

  const remove = () =>
    Alert.alert(
      `¿Borrar «${existing?.name}»?`,
      'Los días de tu rotación y los cambios con este turno pasarán a ser libres.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            deleteType(existing!.id);
            router.back();
          },
        },
      ],
    );

  return (
    <View style={styles.container}>
      <NavHeader
        modal
        title={existing ? 'Editar turno' : 'Nuevo turno'}
        right={
          <Pressable onPress={save} disabled={!valid} hitSlop={8}>
            <Text style={[styles.save, !valid && styles.disabled]}>Guardar</Text>
          </Pressable>
        }
      />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
      >
        <View style={styles.preview}>
          <ShiftBadge type={draft.abbr ? draft : { ...draft, abbr: '?' }} />
          <Text style={styles.previewText}>
            {timesOk
              ? `${shiftHours(draft)} h${crossesMidnight(draft) ? ' · acaba al día siguiente' : ''}`
              : 'Escribe las horas como 06:00'}
          </Text>
        </View>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Mañana"
          placeholderTextColor={COLORS.muted}
          maxLength={24}
        />

        <Text style={styles.label}>Abreviatura</Text>
        <TextInput
          style={styles.input}
          value={abbr}
          onChangeText={(t) => setAbbr(t.toUpperCase())}
          placeholder="M"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="characters"
          maxLength={3}
        />

        <View style={styles.times}>
          <View style={styles.time}>
            <Text style={styles.label}>Empieza</Text>
            <TextInput
              style={[styles.input, !isTime(start) && styles.inputError]}
              value={start}
              onChangeText={(t) => setStart(normalizeTime(t))}
              placeholder="06:00"
              placeholderTextColor={COLORS.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
          <View style={styles.time}>
            <Text style={styles.label}>Acaba</Text>
            <TextInput
              style={[styles.input, !isTime(end) && styles.inputError]}
              value={end}
              onChangeText={(t) => setEnd(normalizeTime(t))}
              placeholder="14:00"
              placeholderTextColor={COLORS.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>

        <Text style={styles.label}>Descanso</Text>
        <View style={styles.chips}>
          {BREAKS.map((b) => (
            <Chip
              key={b}
              label={b === 0 ? 'Sin descanso' : `${b} min`}
              active={breakMinutes === b}
              onPress={() => setBreakMinutes(b)}
            />
          ))}
        </View>

        <Text style={styles.label}>Color</Text>
        <View style={styles.colors}>
          {(Object.keys(SHIFT_COLORS) as ShiftColor[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setColor(key)}
              accessibilityLabel={SHIFT_COLORS[key].label}
              accessibilityState={{ selected: color === key }}
              style={[
                styles.swatch,
                { backgroundColor: SHIFT_COLORS[key].fill, borderColor: SHIFT_COLORS[key].ink },
                color === key && { borderColor: theme.accent, borderWidth: 3 },
              ]}
            >
              <Text style={[styles.swatchText, { color: SHIFT_COLORS[key].ink }]}>
                {draft.abbr || 'A'}
              </Text>
            </Pressable>
          ))}
        </View>

        {existing && (
          <Pressable style={({ pressed }) => [styles.delete, pressed && styles.pressed]} onPress={remove}>
            <Text style={styles.deleteText}>Borrar tipo de turno</Text>
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
    preview: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    previewText: { color: COLORS.muted, fontSize: 15 },
    label: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 18,
      marginBottom: 8,
    },
    input: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      fontSize: 17,
      borderWidth: 1.5,
      borderColor: COLORS.surface,
    },
    inputError: { borderColor: COLORS.danger },
    times: { flexDirection: 'row', gap: 12 },
    time: { flex: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    swatch: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchText: { fontSize: 15, fontWeight: '800' },
    pressed: { opacity: 0.6 },
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
