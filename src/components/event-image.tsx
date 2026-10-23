import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { HoloFrame } from '@/components/holo-frame';
import { SourceBadge } from '@/components/source-badge';
import type { Concert } from '@/data/concerts';
import { COLORS } from '@/theme';

const SOURCE_POSITION = { top: 14, left: 20 };

type Props = {
  concert: Concert;
  going: boolean;
  /** Texto de la insignia "Voy" (más largo en el detalle). */
  goingLabel?: string;
  /** Pie de foto con degradado si vas al concierto. */
  holo?: boolean;
  /** Dónde va la ticketera; por defecto, arriba a la izquierda con el margen estándar. */
  sourcePosition?: { top: number; left: number };
};

/**
 * Foto 16:9 del concierto, la misma en Inicio y en el detalle: ticketera
 * arriba a la izquierda y "Voy" abajo a la izquierda, sobre el pie de foto.
 */
export function EventImage({
  concert,
  going,
  goingLabel = 'Voy',
  holo = false,
  sourcePosition = SOURCE_POSITION,
}: Props) {
  const uri = concert.image || concert.hero;

  const image = uri ? <Image source={{ uri }} style={styles.image} /> : <View style={styles.image} />;

  return (
    <View>
      {/* El marco va solo sobre la foto, por debajo de las insignias */}
      {holo && going ? <HoloFrame>{image}</HoloFrame> : image}

      <View style={[styles.source, sourcePosition]}>
        <SourceBadge offers={concert.offers} />
      </View>

      {going && (
        <View style={styles.going}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
          <Text style={styles.goingText}>{goingLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 16 / 9, backgroundColor: COLORS.surface },
  source: { position: 'absolute' },
  going: {
    position: 'absolute',
    left: 20,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  goingText: { color: COLORS.accent, fontSize: 13, fontWeight: '800' },
});
