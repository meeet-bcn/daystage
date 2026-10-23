import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { HoloFrame } from '@/components/holo-frame';
import { ImagotipoAnimado } from '@/components/imagotipo';
import { SourceBadge } from '@/components/source-badge';
import type { Concert } from '@/data/concerts';
import { COLORS } from '@/theme';

type Props = {
  concert: Concert;
  going: boolean;
  /** Pie de foto con degradado si vas al concierto. */
  holo?: boolean;
  /** Insignia de la ticketera arriba a la izquierda (en el detalle no: ya está en "Comprar"). */
  showSource?: boolean;
};

/**
 * Foto 16:9 del concierto, la misma en Inicio y en el detalle: ticketera
 * arriba a la izquierda (solo en Inicio) y "Meeet In!" abajo a la izquierda, sobre el pie de foto.
 */
export function EventImage({
  concert,
  going,
  holo = false,
  showSource = true,
}: Props) {
  const uri = concert.image || concert.hero;

  const image = uri ? (
    <Image source={{ uri }} style={styles.image} transition={200} />
  ) : (
    <View style={styles.image} />
  );

  return (
    <View>
      {/* El marco va solo sobre la foto, por debajo de las insignias */}
      {holo && going ? <HoloFrame>{image}</HoloFrame> : image}

      {showSource && (
        <View style={styles.source}>
          <SourceBadge offers={concert.offers} />
        </View>
      )}

      {going && (
        <View style={styles.going}>
          {/* Los dos círculos se juntan y se separan: vas a conocer gente */}
          <ImagotipoAnimado height={16} />
          <Text style={styles.goingText}>Meeet In!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 16 / 9, backgroundColor: COLORS.surface },
  source: { position: 'absolute', top: 14, left: 20 },
  going: {
    position: 'absolute',
    left: 20,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  goingText: { color: COLORS.accent, fontSize: 13, fontWeight: '800' },
});
