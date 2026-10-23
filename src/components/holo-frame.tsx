// Pie de foto con degradado para los conciertos a los que vas: una franja ancha
// en la parte inferior de la foto, por dentro y sin encogerla, sobre la que
// queda la insignia "Voy". Es el degradado de la marca
// girando, visible solo en esa franja, así que la luz parece desplazarse.

import { ReactNode, useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { COLORS } from '@/theme';

// Ajustes del efecto
// Alto del pie: la insignia "Voy" de event-image mide 28 y está a 14 del borde,
// así que con 56 quedan centradas con 14 de aire arriba y abajo
const FOOTER_HEIGHT = 56;
const SPIN_MS = 3200; // una vuelta completa del degradado

// El acento de tu tema con el melocotón y la lavanda de la marca
const gradientFor = (accent: string) =>
  `linear-gradient(135deg, ${accent}, ${COLORS.peach}, ${COLORS.lavender}, ${accent}, ${COLORS.peach})`;

type Size = { width: number; height: number };
type Edge = { left: number; top: number; width: number; height: number };

/** Una franja del borde que deja ver su trozo del degradado giratorio. */
function Stroke({ edge, size, spin }: { edge: Edge; size: Size; spin: SharedValue<number> }) {
  const { accent } = useTheme();
  // Cuadrado mayor que la diagonal, centrado en la foto, para cubrir la franja en cualquier giro
  const side = Math.hypot(size.width, size.height) * 1.05;
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.get() * 360}deg` }],
  }));

  return (
    <View pointerEvents="none" style={[styles.edge, edge]}>
      <Animated.View
        style={[
          styles.gradient,
          { experimental_backgroundImage: gradientFor(accent) },
          {
            width: side,
            height: side,
            left: size.width / 2 - side / 2 - edge.left,
            top: size.height / 2 - side / 2 - edge.top,
          },
          spinStyle,
        ]}
      />
    </View>
  );
}

export function HoloFrame({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [size, setSize] = useState<Size | null>(null);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    spin.set(withRepeat(withTiming(1, { duration: SPIN_MS, easing: Easing.linear }), -1));
    return () => cancelAnimation(spin);
  }, [reduceMotion, spin]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size?.width || height !== size?.height) setSize({ width, height });
  };

  const edges: Edge[] = size
    ? [{ left: 0, top: size.height - FOOTER_HEIGHT, width: size.width, height: FOOTER_HEIGHT }]
    : [];

  return (
    <View onLayout={onLayout}>
      {children}
      {size && edges.map((edge, i) => <Stroke key={i} edge={edge} size={size} spin={spin} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  // Al 80 %: se intuye la foto del artista a través del degradado
  edge: { position: 'absolute', overflow: 'hidden', opacity: 0.8 },
  gradient: { position: 'absolute' },
});
