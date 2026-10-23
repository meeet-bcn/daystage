import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { COLORS } from '@/theme';

/** Tamaño de los títulos de pestaña; el logo de Inicio acaba en este mismo tamaño al encogerse. */
export const TITLE_SIZE = 34;
export const TITLE_SPACING = -0.8;

// El título ocupa exactamente la misma caja que el logo de Inicio ya encogido
// (mismo tamaño, altura de línea y distancia a la zona segura), así que quedan a
// la misma altura. Inicio importa estas constantes para su estado encogido.
export const TITLE_LINE_HEIGHT = 42;
export const TITLE_TOP = 0;

type Props = {
  title: string;
  subtitle?: string;
  /** Botón a la derecha del título (p. ej. Ajustes en Perfil). */
  accessory?: ReactNode;
  /** Menos aire debajo, para la cabecera fija (ScreenHeader). */
  compact?: boolean;
};

/** Título grande para las pantallas de pestaña sin cabecera nativa. */
export function ScreenTitle({ title, subtitle, accessory, compact = false }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[styles.container, compact && styles.compact, { paddingTop: insets.top + TITLE_TOP }]}
    >
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
          {/* El punto, con el acento de tu tema (solo el logotipo de Inicio es siempre de marca) */}
          <Text style={{ color: theme.accent }}>.</Text>
        </Text>
        {accessory}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/** Subtítulo bajo una cabecera fija (ScreenHeader): va al principio de la lista. */
export function ScreenSubtitle({ children }: { children: string }) {
  return <Text style={[styles.subtitle, styles.subtitleAlone]}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 20 },
  compact: { paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: {
    flexShrink: 1,
    // Como el logotipo: tinta de la marca y el punto en violeta
    color: COLORS.text,
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_LINE_HEIGHT,
    fontWeight: '700',
    letterSpacing: TITLE_SPACING,
  },
  subtitle: { color: COLORS.muted, fontSize: 15, fontWeight: '500', marginTop: 4 },
  subtitleAlone: { marginTop: 0, paddingHorizontal: 20, paddingBottom: 20 },
});
