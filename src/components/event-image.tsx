import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HoloFrame } from '@/components/holo-frame';
import { Imagotipo } from '@/components/imagotipo';
import { ConcertImage } from '@/components/concert-image';
import type { Concert } from '@/data/concerts';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

type Props = {
  concert: Concert;
  going: boolean;
  /** Pie de foto con degradado si vas al concierto. */
  holo?: boolean;
  /** Tocar la foto (en el detalle: verla en grande). */
  onPressImage?: () => void;
};

/**
 * Foto 16:9 del concierto, la misma en Inicio y en el detalle, con "¡Voy!"
 * abajo a la izquierda, sobre el pie de foto. Sin la fuente: no hace falta saber
 * de dónde viene el concierto.
 */
export function EventImage({
  concert,
  going,
  holo = false,
  onPressImage,
}: Props) {
  const styles = useThemedStyles(makeStyles);

  const photo = <ConcertImage concert={concert} style={styles.image} />;
  const image = onPressImage ? (
    <Pressable
      onPress={onPressImage}
      accessibilityRole="imagebutton"
      accessibilityLabel="Ver la foto en grande"
    >
      {photo}
    </Pressable>
  ) : (
    photo
  );

  return (
    <View>
      {/* El marco va solo sobre la foto, por debajo de las insignias */}
      {holo && going ? <HoloFrame>{image}</HoloFrame> : image}

      {going && (
        <View style={styles.going}>
          <Imagotipo height={16} />
          <Text style={styles.goingText}>Voy</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    image: { width: '100%', aspectRatio: 16 / 9, backgroundColor: COLORS.surface },
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
    goingText: { color: theme.accent, fontSize: 13, fontWeight: '800' },
  });
