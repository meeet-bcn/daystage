// Destellos que salen de un punto, giran y se apagan. Se pintan una vez y
// avisan al acabar (onEnd). Con "Reducir movimiento" no se pinta nada.
// - MeeetInBurst: al darle a "Meeet In!", alrededor de la insignia de la foto.
// - SparkleBurst: en círculo, p. ej. al terminar de recargar Inicio.

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/theme';

// Ajustes de los destellos
const SPARKLE_MS = 900; // vida de cada destello
const RING_SPARKLE_MS = 500; // en círculo, más rápido: la recarga no debe hacer esperar
const STAGGER_MS = 55; // uno tras otro
type Sparkle = { x: number; y: number; size: number; color: string };

// Dirección (x, y en pt) y tamaño de cada destello, alrededor de la insignia
const BADGE_SPARKLES: Sparkle[] = [
  { x: -34, y: -26, size: 16, color: COLORS.white },
  { x: 8, y: -44, size: 12, color: COLORS.peach },
  { x: 52, y: -34, size: 18, color: COLORS.white },
  { x: 96, y: -40, size: 12, color: COLORS.lavender },
  { x: 128, y: -16, size: 16, color: COLORS.peach },
  { x: 134, y: 18, size: 11, color: COLORS.white },
  { x: 70, y: 30, size: 10, color: COLORS.lavender },
  { x: -18, y: 26, size: 11, color: COLORS.peach },
  { x: -46, y: 4, size: 13, color: COLORS.lavender },
  { x: 30, y: -62, size: 10, color: COLORS.white },
];
// En círculo: 10 destellos a 46-58 pt del centro, con los colores de la marca
const RING_COLORS = [COLORS.accent, COLORS.peach, COLORS.lavender, COLORS.peachDeep];
const RING_SPARKLES: Sparkle[] = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * 2 * Math.PI - Math.PI / 2;
  const distance = i % 2 === 0 ? 58 : 46;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    size: i % 2 === 0 ? 14 : 10,
    color: RING_COLORS[i % RING_COLORS.length],
  };
});

function SparkleView({
  x,
  y,
  size,
  color,
  delay,
  life,
}: Sparkle & { delay: number; life: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(delay, withTiming(1, { duration: life, easing: Easing.out(Easing.quad) }))
    );
  }, [delay, life, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: interpolate(p, [0, 0.25, 1], [0, 1, 0]),
      transform: [
        { translateX: x * p },
        { translateY: y * p },
        { scale: interpolate(p, [0, 0.35, 1], [0.2, 1.15, 0.5]) },
        { rotate: `${p * 90}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.sparkle, style]}>
      <Ionicons name="sparkles" size={size} color={color} />
    </Animated.View>
  );
}

function Burst({
  sparkles,
  stagger,
  life = SPARKLE_MS,
  style,
  onEnd,
}: {
  sparkles: Sparkle[];
  stagger: number;
  /** Vida de cada destello en ms. */
  life?: number;
  style: StyleProp<ViewStyle>;
  onEnd: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const duration = life + stagger * (sparkles.length - 1);

  useEffect(() => {
    const timer = setTimeout(onEnd, reduceMotion ? 0 : duration);
    return () => clearTimeout(timer);
  }, [onEnd, reduceMotion, duration]);

  if (reduceMotion) return null;

  return (
    <View pointerEvents="none" style={style}>
      {sparkles.map((s, i) => (
        <SparkleView key={i} {...s} delay={i * stagger} life={life} />
      ))}
    </View>
  );
}

/** Destellos alrededor de la insignia "Meeet In!" (colócalo en su misma posición). */
export function MeeetInBurst({ onEnd }: { onEnd: () => void }) {
  return (
    <Burst sparkles={BADGE_SPARKLES} stagger={STAGGER_MS} style={styles.origin} onEnd={onEnd} />
  );
}

/** Explosión en círculo desde el centro de su contenedor (todos a la vez, casi). */
export function SparkleBurst({ onEnd }: { onEnd: () => void }) {
  return (
    <Burst
      sparkles={RING_SPARKLES}
      stagger={8}
      life={RING_SPARKLE_MS}
      style={styles.center}
      onEnd={onEnd}
    />
  );
}

const styles = StyleSheet.create({
  // Los destellos salen del centro-izquierda de la insignia
  origin: { position: 'absolute', left: 40, bottom: 28 },
  center: { position: 'absolute', left: '50%', top: '50%' },
  sparkle: { position: 'absolute', left: -8, top: -8 },
});
