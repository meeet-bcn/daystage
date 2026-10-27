// Pie de foto para los conciertos a los que vas: una franja en la parte
// inferior de la foto, por dentro y sin encogerla, con el degradado de la
// marca, sobre la que queda la insignia "Voy". Quieto: sin animaciones.

import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { COLORS } from '@/theme';

// Alto del pie: la insignia "Voy" de event-image mide 28 y está a 14 del borde,
// así que con 56 quedan centradas con 14 de aire arriba y abajo
const FOOTER_HEIGHT = 56;

// El acento de tu tema con el melocotón y la lavanda de la marca
const gradientFor = (accent: string) =>
  `linear-gradient(135deg, ${accent}, ${COLORS.peach}, ${COLORS.lavender})`;

export function HoloFrame({ children }: { children: ReactNode }) {
  const { accent } = useTheme();
  return (
    <View>
      {children}
      <View
        pointerEvents="none"
        style={[styles.footer, { experimental_backgroundImage: gradientFor(accent) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Al 80 %: se intuye la foto del artista a través del degradado
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FOOTER_HEIGHT, opacity: 0.8 },
});
