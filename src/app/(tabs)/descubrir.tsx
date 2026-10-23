import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenTitle } from '@/components/screen-title';
import { BottomTabInset } from '@/constants/theme';
import { COLORS } from '@/theme';

// Aquí irán las recomendaciones basadas en los gustos del usuario
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      // El margen superior lo pone ScreenTitle; sin esto iOS lo suma otra vez
      contentInsetAdjustmentBehavior="never"
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 32 }}
    >
      <ScreenTitle title="Descubrir" subtitle="Conciertos elegidos para ti" />

      <View style={styles.card}>
        <Ionicons name="sparkles" size={32} color={COLORS.lavender} />
        <Text style={styles.cardTitle}>Recomendaciones para ti</Text>
        <Text style={styles.cardText}>
          Muy pronto te recomendaremos conciertos según tus gustos y los artistas que sigues.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
  cardText: { color: COLORS.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
