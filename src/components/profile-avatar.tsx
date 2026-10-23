import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet } from 'react-native';

import { COLORS } from '@/theme';

type Props = {
  size?: number;
  /** Foto de perfil. Sin ella se muestra el icono genérico. */
  uri?: string;
  onPress?: () => void;
};

export function ProfileAvatar({ size = 36, uri, onPress }: Props) {
  const shape = { width: size, height: size, borderRadius: size / 2 };

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
