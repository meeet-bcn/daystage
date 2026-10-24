// Fondo del perfil con vida: el degradado elegido en Editar perfil y, encima,
// dos manchas suaves de sus mismos colores que derivan muy despacio, así que la
// luz parece moverse sin cambiar el fondo. Con "Reducir movimiento", quieto.

import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import {
  PROFILE_BACKGROUNDS,
  profileGradient,
  ProfileBackground,
} from "@/theme";

// Ajustes del movimiento
const DRIFT_MS = [11000, 14000]; // ida de cada mancha (luego vuelve): lento a propósito
const DRIFT = 0.18; // cuánto se desplaza cada mancha, en fracción del ancho
const BLOB_SIZE = 1.3; // diámetro de la mancha, en fracción del ancho

// Mancha circular que se difumina hasta transparente (hex + alfa 00)
const blobGradient = (color: string) =>
  `radial-gradient(circle, ${color} 0%, ${color}00 70%)`;

type BlobProps = {
  color: string;
  progress: SharedValue<number>;
  // Posición de partida (fracción del ancho/alto) y dirección del viaje
  from: { x: number; y: number };
  dir: { x: number; y: number };
  width: number;
};

function Blob({ color, progress, from, dir, width }: BlobProps) {
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      transform: [
        { translateX: dir.x * DRIFT * p * width },
        { translateY: dir.y * DRIFT * p * width },
        { scale: 1 + 0.08 * p },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          left: `${(from.x - BLOB_SIZE / 2) * 100}%`,
          top: `${from.y * 100}%`,
          width: `${BLOB_SIZE * 100}%`,
          experimental_backgroundImage: blobGradient(color),
        },
        style,
      ]}
    />
  );
}

export function ProfileBackdrop({
  background,
}: {
  background: ProfileBackground;
}) {
  const reduceMotion = useReducedMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const [width, setWidth] = useState(0);
  const { from, to } =
    PROFILE_BACKGROUNDS[background] ?? PROFILE_BACKGROUNDS.none;

  useEffect(() => {
    if (reduceMotion) return;
    const ease = Easing.inOut(Easing.sin);
    a.set(
      withRepeat(
        withTiming(1, { duration: DRIFT_MS[0], easing: ease }),
        -1,
        true,
      ),
    );
    b.set(
      withRepeat(
        withTiming(1, { duration: DRIFT_MS[1], easing: ease }),
        -1,
        true,
      ),
    );
    return () => {
      cancelAnimation(a);
      cancelAnimation(b);
    };
  }, [reduceMotion, a, b]);

  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        styles.fill,
        { experimental_backgroundImage: profileGradient(background) },
      ]}
    >
      {/* El color de abajo sube por la izquierda; el de arriba baja por la derecha */}
      <Blob
        color={to}
        progress={a}
        from={{ x: 0.1, y: 0.15 }}
        dir={{ x: 1, y: -0.6 }}
        width={width}
      />
      <Blob
        color={from}
        progress={b}
        from={{ x: 0.9, y: 0.05 }}
        dir={{ x: -1, y: 0.8 }}
        width={width}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  blob: { position: "absolute", aspectRatio: 1, opacity: 0.85 },
});
