import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { SourceBadge } from '@/components/source-badge';
import type { Concert } from '@/data/concerts';
import { COLORS } from '@/theme';

type Props = {
  concert: Concert;
  going: boolean;
  /** Texto de la insignia "Voy" (más largo en el detalle). */
  goingLabel?: string;
};

/**
 * Foto 16:9 del concierto, la misma en Inicio y en el detalle: ticketera
 * abajo a la izquierda y "Voy" abajo a la derecha.
 */
export function EventImage({ concert, going, goingLabel = 'Voy' }: Props) {
  const uri = concert.image || concert.hero;

  return (
    <View>
      {uri ? <Image source={{ uri }} style={styles.image} /> : <View style={styles.image} />}

      <View style={styles.source}>
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
  source: { position: 'absolute', left: 20, bottom: 14 },
  going: {
    position: 'absolute',
    right: 20,
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
