// Fondo del perfil: el degradado elegido en Editar perfil y, encima, tres
// manchas suaves de sus mismos colores. Quieto (sin animaciones decorativas).
// Ocupa el perfil entero (también bajo la cuadrícula).

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { PROFILE_BACKGROUNDS, profileGradient, ProfileBackground } from '@/theme';

// Ajustes de las manchas (están quietas: el progreso se queda en 0)
const DRIFT = 0.32; // cuánto se desplaza cada mancha, en fracción del ancho
const PULSE = 0.18; // cuánto crece al ir
const BLOB_SIZE = 1.2; // diámetro de la mancha, en fracción del ancho

// Mancha circular que se difumina hasta transparente (hex + alfa 00)
const blobGradient = (color: string) => `radial-gradient(circle, ${color} 0%, ${color}00 70%)`;

type BlobProps = {
  color: string;
  progress: SharedValue<number>;
  // Posición de partida (fracción del ancho y del alto) y dirección del viaje
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
        { scale: 1 + PULSE * p },
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

export function ProfileBackdrop({ background }: { background: ProfileBackground }) {
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const c = useSharedValue(0);
  const [width, setWidth] = useState(0);
  const { from, to } = PROFILE_BACKGROUNDS[background] ?? PROFILE_BACKGROUNDS.none;


  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.fill, { experimental_backgroundImage: profileGradient(background) }]}
    >
      {/* El color de abajo sube por la izquierda, el de arriba baja por la derecha
          y otro del de abajo cruza la parte de la cuadrícula */}
      <Blob color={to} progress={a} from={{ x: 0.1, y: 0.05 }} dir={{ x: 1, y: 0.5 }} width={width} />
      <Blob
        color={from}
        progress={b}
        from={{ x: 0.9, y: 0.3 }}
        dir={{ x: -1, y: -0.7 }}
        width={width}
      />
      <Blob color={to} progress={c} from={{ x: 0.6, y: 0.62 }} dir={{ x: -0.8, y: 0.6 }} width={width} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  blob: { position: 'absolute', aspectRatio: 1, opacity: 0.9 },
});
