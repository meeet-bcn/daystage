import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Animated, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ScreenSubtitle } from '@/components/screen-title';
import { BottomTabInset } from '@/constants/theme';
import { COLORS } from '@/theme';

// Aquí irán las recomendaciones basadas en los gustos del usuario
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useAnimatedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        // El margen superior lo pone la cabecera fija; sin esto iOS lo suma otra vez
        contentInsetAdjustmentBehavior="never"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ top: headerHeight }}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + BottomTabInset + 32,
        }}
      >
        <ScreenSubtitle>Conciertos elegidos para ti</ScreenSubtitle>

        <View style={styles.card}>
          <Ionicons name="sparkles" size={32} color={COLORS.lavender} />
          <Text style={styles.cardTitle}>Recomendaciones para ti</Text>
          <Text style={styles.cardText}>
            Muy pronto te recomendaremos conciertos según tus gustos y los artistas que sigues.
          </Text>
        </View>
      </Animated.ScrollView>
      {/* Fija arriba, de cristal: el contenido pasa por debajo */}
      <ScreenHeader title="Descubrir" scrollY={scrollY} onHeight={setHeaderHeight} />
    </View>
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
