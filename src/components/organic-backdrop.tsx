// Fondo de la creación de perfil: el imagotipo, gigante,
// desbordando la pantalla. Se desplaza y gira muy despacio, sin crecer ni
// encoger. Con
// "Reducir movimiento", quieto.

import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Imagotipo } from '@/components/imagotipo';
import { COLORS } from '@/theme';

// Ajustes del movimiento (lento a propósito)
const SIZE = 1.15; // alto del imagotipo, en anchos de pantalla: se sale por los lados
const DRIFT = 60; // pt que se desplaza a cada lado
const DRIFT_X_MS = 17000;
const DRIFT_Y_MS = 23000; // distinto del horizontal: el recorrido nunca se repite igual
const TURN_MS = 120000; // una vuelta entera, dos minutos

export function OrganicBackdrop() {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const driftX = useSharedValue(0);
  const driftY = useSharedValue(0);
  const turn = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    const sine = Easing.inOut(Easing.sin);
    driftX.set(withRepeat(withTiming(1, { duration: DRIFT_X_MS, easing: sine }), -1, true));
    driftY.set(withRepeat(withTiming(1, { duration: DRIFT_Y_MS, easing: sine }), -1, true));
    turn.set(withRepeat(withTiming(1, { duration: TURN_MS, easing: Easing.linear }), -1));
    return () => [driftX, driftY, turn].forEach(cancelAnimation);
  }, [reduceMotion, driftX, driftY, turn]);

  const markHeight = width * SIZE;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (driftX.get() * 2 - 1) * DRIFT },
      { translateY: (driftY.get() * 2 - 1) * DRIFT },
      { rotate: `${turn.get() * 360}deg` },
    ],
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.container]}>
      <Animated.View
        style={[
          styles.mark,
          { top: height / 2 - markHeight / 2, left: width / 2 - markHeight * 0.56 },
          style,
        ]}
      >
        <Imagotipo height={markHeight} />
      </Animated.View>
      {/* Velo blanco: el imagotipo queda de fondo, suave, y el texto se lee bien */}
      <View style={[StyleSheet.absoluteFill, styles.veil]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.mist, overflow: 'hidden' },
  mark: { position: 'absolute', opacity: 0.5 },
  veil: { backgroundColor: 'rgba(255,255,255,0.45)' },
});
