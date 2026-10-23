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

import { COLORS } from '@/theme';

// Ajustes del efecto
// Alto del pie: la insignia "Voy" de event-image mide 28 y está a 14 del borde,
// así que con 56 quedan centradas con 14 de aire arriba y abajo
const FOOTER_HEIGHT = 56;
const SPIN_MS = 3200; // una vuelta completa del degradado

const BRAND_GRADIENT = `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.peach}, ${COLORS.lavender}, ${COLORS.accent}, ${COLORS.peach})`;

type Size = { width: number; height: number };
type Edge = { left: number; top: number; width: number; height: number };

/** Una franja del borde que deja ver su trozo del degradado giratorio. */
function Stroke({ edge, size, spin }: { edge: Edge; size: Size; spin: SharedValue<number> }) {
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
  edge: { position: 'absolute', overflow: 'hidden' },
  gradient: { position: 'absolute', experimental_backgroundImage: BRAND_GRADIENT },
});
