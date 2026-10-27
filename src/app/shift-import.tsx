import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavHeader } from '@/components/nav-header';
import { ShiftBadge } from '@/components/shift-badge';
import { buildImport, parseShiftList } from '@/data/shift-import';
import { formatShiftTime } from '@/data/shifts';
import { useShifts } from '@/data/shifts-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

/**
 * Turnos › Importar: pegar los turnos de otra app o de la empresa, un día por
 * entrada ("AAMMDD=HH:MM-HH:MM" o "AAMMDD=V"). Cada horario pasa a ser un tipo
 * (verde de mañana, rojo de tarde, ámbar vacaciones) y cada día, un cambio.
 */
export default function ShiftImportScreen() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { plan, importShifts } = useShifts();
  const [text, setText] = useState('');

  const parsed = useMemo(() => parseShiftList(text), [text]);
  const result = useMemo(() => buildImport(parsed.entries, plan.types), [parsed, plan.types]);
  const replaced = parsed.entries.filter((e) => e.date in plan.overrides).length;
  const first = parsed.entries[0]?.date;
  const last = parsed.entries.at(-1)?.date;

  const save = () => {
    importShifts(result.newTypes, result.overrides);
    Alert.alert(
      'Turnos importados',
      `${result.overrides.length} días${result.newTypes.length ? ` y ${result.newTypes.length} tipos de turno nuevos` : ''}.`
    );
    router.back();
  };

  return (
    <View style={styles.container}>
      <NavHeader
        modal
        title="Importar turnos"
        right={
          <Pressable onPress={save} disabled={result.overrides.length === 0} hitSlop={8}>
            <Text style={[styles.save, result.overrides.length === 0 && styles.disabled]}>Importar</Text>
          </Pressable>
        }
      />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
      >
        <Text style={styles.help}>
          Pega tus turnos: un día por entrada, separados por espacios o saltos de línea. Por ejemplo{' '}
          <Text style={styles.mono}>330301=7:30-15:30 330302=14:00-22:00 330303=V</Text> (año, mes
          y día; «V» son vacaciones). Los días que importes mandan sobre tu rotación.
        </Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="330301=7:30-15:30 …"
          placeholderTextColor={COLORS.muted}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
        />

        {parsed.entries.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              {parsed.entries.length} días · del {first} al {last}
            </Text>
            {replaced > 0 && (
              <Text style={styles.summaryText}>{replaced} ya tenían un cambio: se sustituyen.</Text>
            )}
            {result.newTypes.length > 0 && (
              <>
                <Text style={styles.summaryText}>Tipos de turno nuevos:</Text>
                {result.newTypes.map((t) => (
                  <View key={t.id} style={styles.typeRow}>
                    <ShiftBadge type={t} size="small" />
                    <Text style={styles.typeName}>{t.name}</Text>
                    <Text style={styles.typeTime}>{formatShiftTime(t)}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
        {parsed.errors.length > 0 && (
          <Text style={styles.errors}>
            No se han entendido {parsed.errors.length}: {parsed.errors.slice(0, 3).join(' · ')}
            {parsed.errors.length > 3 ? '…' : ''}
          </Text>
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
    help: { color: COLORS.muted, fontSize: 14, lineHeight: 20 },
    mono: { fontFamily: 'Menlo', fontSize: 13, color: COLORS.text },
    input: {
      minHeight: 160,
      marginTop: 14,
      padding: 14,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      fontSize: 14,
      fontFamily: 'Menlo',
    },
    summary: { marginTop: 18, padding: 16, borderRadius: 16, backgroundColor: COLORS.mist, gap: 8 },
    summaryTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    summaryText: { color: COLORS.muted, fontSize: 14 },
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    typeName: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '600' },
    typeTime: { color: COLORS.muted, fontSize: 13, fontVariant: ['tabular-nums'] },
    errors: { color: COLORS.danger, fontSize: 13, marginTop: 12, lineHeight: 18 },
  });
