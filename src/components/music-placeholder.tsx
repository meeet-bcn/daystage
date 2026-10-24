import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { COLORS } from '@/theme';

/**
 * Imagen genérica de música para los conciertos sin foto: un degradado con el
 * acento de tu tema y la lavanda y el melocotón de la marca, con unas notas.
 */
export function MusicPlaceholder({
  style,
  iconSize = 64,
}: {
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}) {
  const { accent } = useTheme();
  return (
    <View
      style={[
        styles.box,
        {
          experimental_backgroundImage: `linear-gradient(135deg, ${COLORS.lavender}, ${accent}, ${COLORS.peach})`,
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name="musical-notes" size={iconSize} color="rgba(255,255,255,0.85)" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
