import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Animated, Pressable, StyleSheet, useAnimatedValue } from 'react-native';

import { useApp } from '@/data/app-context';
import type { Concert } from '@/data/concerts';
import { COLORS } from '@/theme';

type Props = {
  concert: Concert;
  /** Lado del botón redondo (46 junto a "Meeet In!", como el resto de botones). */
  size?: number;
};

/** Corazón de la lista de deseos: conciertos que te interesan, aunque aún no vayas. */
export function WishButton({ concert, size = 46 }: Props) {
  const { isWished, toggleWish, settings, profile } = useApp();
  const wished = isWished(concert.id);
  const scale = useAnimatedValue(1);

  const onPress = () => {
    // La lista de deseos es una de las ventajas del perfil: sin él, a crearlo
    if (!profile.created) return router.push('/onboarding');
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!wished) {
      // Late un momento al añadirlo
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 110, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }),
      ]).start();
    }
    toggleWish(concert);
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: wished }}
      accessibilityLabel={wished ? 'Quitar de tu lista de deseos' : 'Añadir a tu lista de deseos'}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={wished ? 'heart' : 'heart-outline'}
          size={size * 0.48}
          color={wished ? COLORS.peachDeep : COLORS.text}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  pressed: { opacity: 0.7 },
});
