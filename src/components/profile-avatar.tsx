import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet } from 'react-native';

import { COLORS } from '@/theme';

// Esquinas de la foto cuadrada (Perfil y Editar perfil), en fracción del lado
const ROUNDED_RADIUS = 0.28;

type Props = {
  size?: number;
  /** Foto de perfil. Sin ella se muestra el icono genérico. */
  uri?: string;
  onPress?: () => void;
  /** Cuadrada con las esquinas redondeadas (la foto de tu perfil); si no, en círculo. */
  rounded?: boolean;
};

export function ProfileAvatar({ size = 36, uri, onPress, rounded = false }: Props) {
  const shape = {
    width: size,
    height: size,
    borderRadius: rounded ? size * ROUNDED_RADIUS : size / 2,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Tu perfil"
      style={({ pressed }) => [styles.circle, shape, pressed && styles.pressed]}
    >
      {uri ? (
        <Image source={{ uri }} style={shape} />
      ) : (
        <Ionicons name="person" size={size * 0.5} color={COLORS.muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
  },
  pressed: { opacity: 0.7 },
});
