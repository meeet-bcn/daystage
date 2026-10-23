import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { ScreenTitle } from '@/components/screen-title';
import { COLORS } from '@/theme';

type Props = {
  title: string;
  /** Botón a la derecha del título (p. ej. Ajustes en Perfil). */
  accessory?: ReactNode;
  /** Lo que también queda fijo bajo el título (p. ej. el buscador). */
  children?: ReactNode;
  /** Scroll de la lista: la línea inferior aparece en cuanto hay contenido debajo. */
  scrollY: Animated.Value;
  /** Alto de la cabecera, para que la lista empiece justo debajo. */
  onHeight: (height: number) => void;
};

/**
 * Cabecera fija de cristal para las pestañas, como la de Inicio: el título se
 * queda arriba y el contenido pasa por debajo, desenfocado. Ponla después de
 * la lista (así queda encima) y da a la lista un margen superior de `onHeight`.
 */
export function ScreenHeader({ title, accessory, children, scrollY, onHeight }: Props) {
  const lineOpacity = scrollY.interpolate({
    inputRange: [0, 12],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.header} onLayout={(e) => onHeight(e.nativeEvent.layout.height)}>
      <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.glass]} />
      <ScreenTitle title={title} accessory={accessory} compact />
      {children}
      <Animated.View style={[styles.line, { opacity: lineOpacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  glass: { backgroundColor: 'rgba(255,255,255,0.45)' },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.line,
  },
});
