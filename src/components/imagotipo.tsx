import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/theme';

// Geometría en unidades del radio (la misma que scripts/generate-brand-assets.swift):
// el círculo melocotón está arriba a la derecha del lavanda
const OFFSET_X = 0.705;
const OFFSET_Y = 0.41;
// Ajustes de la animación de ImagotipoAnimado
const MEET_MS = 1100; // lo que tardan en juntarse (y en separarse)
const HOLD_MS = 350; // pausa juntos y pausa separados

/** Ancho / alto del imagotipo. */
export const IMAGOTIPO_RATIO = (2 + OFFSET_X) / (2 + OFFSET_Y);

/** Imagotipo de MEEET: dos círculos que se encuentran, con el cruce en violeta. */
export function Imagotipo({ height }: { height: number }) {
  const r = height / (2 + OFFSET_Y);
  const circle = { width: 2 * r, height: 2 * r, borderRadius: r };

  return (
    <View
      style={{ width: height * IMAGOTIPO_RATIO, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.circle, circle, styles.peach, { left: OFFSET_X * r, top: 0 }]} />
      {/* El lavanda recorta una copia del melocotón: lo que queda dentro es el cruce */}
      <View
        style={[styles.circle, circle, styles.lavender, styles.clip, { left: 0, top: OFFSET_Y * r }]}
      >
        <View
          style={[styles.circle, circle, styles.cross, { left: OFFSET_X * r, top: -OFFSET_Y * r }]}
        />
      </View>
    </View>
  );
}

/**
 * Imagotipo animado para "Meeet In!": los dos círculos se acercan por su
 * diagonal hasta quedar uno encima del otro (un solo círculo, todo cruce) y
 * se vuelven a separar, sin parar. Con "Reducir movimiento", quieto.
 */
export function ImagotipoAnimado({ height }: { height: number }) {
  const reduceMotion = useReducedMotion();
  const meet = useSharedValue(0); // 0 = separados, 1 = juntos

  useEffect(() => {
    if (reduceMotion) return;
    const easing = Easing.inOut(Easing.cubic);
    meet.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: MEET_MS, easing }),
          withDelay(HOLD_MS, withTiming(0, { duration: MEET_MS, easing })),
          withDelay(HOLD_MS, withTiming(0, { duration: 0 }))
        ),
        -1
      )
    );
    return () => cancelAnimation(meet);
  }, [reduceMotion, meet]);

  const r = height / (2 + OFFSET_Y);
  const dx = OFFSET_X * r;
  const dy = OFFSET_Y * r;
  const circle = { width: 2 * r, height: 2 * r, borderRadius: r };

  // Los dos van hacia el punto medio: el lavanda sube a la derecha, el melocotón baja a la izquierda
  const lavenderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (dx / 2) * meet.get() }, { translateY: (-dy / 2) * meet.get() }],
  }));
  const peachStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (-dx / 2) * meet.get() }, { translateY: (dy / 2) * meet.get() }],
  }));
  // El cruce es el melocotón visto desde dentro del lavanda
  const crossStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -dx * meet.get() }, { translateY: dy * meet.get() }],
  }));

  return (
    <View
      style={{ width: height * IMAGOTIPO_RATIO, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[styles.circle, circle, styles.peach, { left: dx, top: 0 }, peachStyle]}
      />
      <Animated.View
        style={[
          styles.circle,
          circle,
          styles.lavender,
          styles.clip,
          { left: 0, top: dy },
          lavenderStyle,
        ]}
      >
        <Animated.View
          style={[styles.circle, circle, styles.cross, { left: dx, top: -dy }, crossStyle]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { position: 'absolute' },
  clip: { overflow: 'hidden' },
  peach: { backgroundColor: COLORS.peach },
  lavender: { backgroundColor: COLORS.lavender },
  cross: { backgroundColor: COLORS.accent },
});
