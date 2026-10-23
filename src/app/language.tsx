import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { useApp } from '@/data/app-context';
import { LANGUAGES } from '@/data/filters';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

/** Hoja del chip "Idioma": en qué idiomas quieres hablar con la gente que vas a conocer. */
export default function LanguageSheet() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { filters, setFilters } = useApp();

  const toggle = (code: string) =>
    setFilters((f) => ({
      ...f,
      languages: f.languages.includes(code)
        ? f.languages.filter((l) => l !== code)
        : [...f.languages, code],
    }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Idioma</Text>
        {filters.languages.length > 0 ? (
          <Pressable onPress={() => setFilters((f) => ({ ...f, languages: [] }))} hitSlop={8}>
            <Text style={styles.reset}>Quitar</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.subtitle}>
        ¿En qué idioma quieres hablar con la gente que conozcas en los conciertos? Puedes elegir
        varios.
      </Text>

      <View style={styles.chips}>
        {LANGUAGES.map((l) => (
          <Chip
            key={l.code}
            label={l.label}
            active={filters.languages.includes(l.code)}
            onPress={() => toggle(l.code)}
          />
        ))}
      </View>

      {/* Aún no hay asistentes reales: el filtro se guarda, pero no cambia la lista */}
      <Text style={styles.note}>
        Es el idioma de la gente que quieres conocer, no el de los conciertos. En la beta aún no hay
        asistentes: cuando los haya, verás primero los conciertos con gente que lo habla.
      </Text>

      <Pressable style={styles.apply} onPress={() => router.back()}>
        <Text style={styles.applyText}>Listo</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { backgroundColor: COLORS.background },
    content: { padding: 20, paddingTop: 28 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: COLORS.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
    reset: { color: theme.accent, fontSize: 15, fontWeight: '700' },
    subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 21, marginTop: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
    note: {
      color: COLORS.muted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 24,
      padding: 14,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
    },
    apply: {
      height: 54,
      borderRadius: 27,
      backgroundColor: COLORS.text,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 28,
    },
    applyText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  });
