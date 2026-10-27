import { useEffect } from 'react';
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

import { DayStageMark, MARK_HEIGHT } from '@/components/daystage-mark';

// Ajustes de la animación de ImagotipoAnimado: un latido suave
const BEAT_MS = 1100; // lo que tarda en crecer (y en volver)
const HOLD_MS = 350; // pausa entre latidos
const BEAT_SCALE = 1.08;

/** Ancho / alto del imagotipo (las anillas asoman por arriba). */
export const IMAGOTIPO_RATIO = 1 / MARK_HEIGHT;

/** Imagotipo de DayStage (calendario con un foco), de alto total `height`. */
export function Imagotipo({ height }: { height: number }) {
  return <DayStageMark size={height / MARK_HEIGHT} />;
}

/**
 * Imagotipo animado (insignia «¡Voy!», cargas, bienvenida): late despacio, sin
 * parar. Con "Reducir movimiento", quieto.
 */
export function ImagotipoAnimado({
  height,
  meetMs = BEAT_MS,
  holdMs = HOLD_MS,
}: {
  height: number;
  /** Lo que tarda cada latido; más lento = más relajante (fondo de la bienvenida). */
  meetMs?: number;
  holdMs?: number;
}) {
  const reduceMotion = useReducedMotion();
  const beat = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    const easing = Easing.inOut(Easing.cubic);
    beat.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: meetMs, easing }),
          withDelay(holdMs, withTiming(0, { duration: meetMs, easing })),
          withDelay(holdMs, withTiming(0, { duration: 0 }))
        ),
        -1
      )
    );
    return () => cancelAnimation(beat);
  }, [reduceMotion, beat, meetMs, holdMs]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (BEAT_SCALE - 1) * beat.get() }],
  }));

  return (
    <Animated.View style={style}>
      <DayStageMark size={height / MARK_HEIGHT} />
    </Animated.View>
  );
}
