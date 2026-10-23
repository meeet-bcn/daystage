import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/theme';

type Props = { title: string; subtitle?: string };

/** Título grande para las pantallas de pestaña sin cabecera nativa. */
export function ScreenTitle({ title, subtitle }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>
        {title}
        <Text style={{ color: COLORS.peach }}>.</Text>
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 20 },
  title: { color: COLORS.accent, fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: COLORS.muted, fontSize: 15, fontWeight: '500', marginTop: 4 },
});
