import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { HoloFrame } from '@/components/holo-frame';
import { ImagotipoAnimado } from '@/components/imagotipo';
import { MeeetInBurst } from '@/components/meeet-in-burst';
import { SourceBadge } from '@/components/source-badge';
import { useApp } from '@/data/app-context';
import type { Concert } from '@/data/concerts';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

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
export function EventImage({ concert, going, holo = false, showSource = true }: Props) {
  const styles = useThemedStyles(makeStyles);
  const uri = concert.image || concert.hero;
  const { celebration, endCelebration } = useApp();
  // Acabas de darle a "Meeet In!" en este concierto: la insignia entra con brillos
  const celebrating = going && celebration?.id === concert.id;

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
        <Animated.View
          style={styles.going}
          entering={celebrating ? ZoomIn.springify().damping(11) : undefined}
        >
          {/* Los dos círculos se juntan y se separan: vas a conocer gente */}
          <ImagotipoAnimado height={16} />
          <Text style={styles.goingText}>Meeet In!</Text>
          {celebrating && <Shine />}
        </Animated.View>
      )}

      {celebrating && <MeeetInBurst key={celebration.at} onEnd={endCelebration} />}
    </View>
  );
}

// Ajustes del reflejo de la insignia
const SHINE_MS = 650;
const SHINE_DELAY_MS = 180; // tras el rebote de entrada
const SHINE_WIDTH = 36;
const SHINE_TRAVEL = 160; // de un lado a otro de la insignia

/** Reflejo que cruza la insignia una vez, como luz sobre una tarjeta. */
function Shine() {
  const styles = useThemedStyles(makeStyles);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(
      withDelay(
        SHINE_DELAY_MS,
        withTiming(1, { duration: SHINE_MS, easing: Easing.inOut(Easing.quad) })
      )
    );
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -SHINE_WIDTH + SHINE_TRAVEL * progress.get() }, { skewX: '-20deg' }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.shine, style]} />;
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
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
      overflow: 'hidden', // recorta el reflejo a la pastilla
    },
    shine: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: SHINE_WIDTH,
      experimental_backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0), ${COLORS.lavender}, rgba(255,255,255,0))`,
      opacity: 0.7,
    },
    goingText: { color: theme.accent, fontSize: 13, fontWeight: '800' },
  });
