// Fondo de la creación de perfil: el imagotipo, gigante y quieto, desbordando
// la pantalla bajo un velo blanco.

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Imagotipo } from '@/components/imagotipo';
import { COLORS } from '@/theme';

const SIZE = 1.15; // alto del imagotipo, en anchos de pantalla: se sale por los lados

export function OrganicBackdrop() {
  const { width, height } = useWindowDimensions();
  const markHeight = width * SIZE;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.container]}>
      <View
        style={[
          styles.mark,
          { top: height / 2 - markHeight / 2, left: width / 2 - markHeight * 0.46 },
        ]}
      >
        <Imagotipo height={markHeight} />
      </View>
      {/* Velo blanco: el imagotipo queda de fondo, suave, y el texto se lee bien */}
      <View style={[StyleSheet.absoluteFill, styles.veil]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.mist, overflow: 'hidden' },
  mark: { position: 'absolute', opacity: 0.25 },
  veil: { backgroundColor: 'rgba(255,255,255,0.45)' },
});
