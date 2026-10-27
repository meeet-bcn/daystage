import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useApp } from '@/data/app-context';
import type { Concert } from '@/data/concerts';
import { COLORS } from '@/theme';

type Props = {
  concert: Concert;
  /** Lado del botón redondo (46 junto a "¡Voy!", como el resto de botones). */
  size?: number;
};

/** Corazón de la lista de deseos: conciertos que te interesan, aunque aún no vayas. */
export function WishButton({ concert, size = 46 }: Props) {
  const { isWished, toggleWish, settings, profile } = useApp();
  const wished = isWished(concert.id);

  const onPress = () => {
    // La lista de deseos es una de las ventajas del perfil: sin él, a crearlo
    if (!profile.created) return router.push('/onboarding');
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      <Ionicons
        name={wished ? 'heart' : 'heart-outline'}
        size={size * 0.48}
        color={wished ? COLORS.peachDeep : COLORS.text}
      />
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
