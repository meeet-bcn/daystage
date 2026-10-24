import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router';
import { Ref, useEffect, useImperativeHandle, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { Concert } from '@/data/concerts';
import { tasteGenre } from '@/data/taste';
import { ConcertImage } from '@/components/concert-image';
import { useFadedPreview } from '@/hooks/use-faded-preview';
import { useThemedStyles } from '@/hooks/use-theme';
import { useTopSong } from '@/hooks/use-top-song';
import { COLORS, Theme } from '@/theme';

// Ajustes del gesto
const SWIPE_DISTANCE = 120; // pt que hay que arrastrar para que cuente
const SWIPE_VELOCITY = 800; // o un gesto rápido
const FLY_MS = 260; // lo que tarda en salir de la pantalla
// Alto fijo del texto de la carta: los botones flotan sobre la foto, justo encima
const INFO_H = 150;
// La carta de detrás asoma un poco más pequeña y baja; al pasar delante, crece
const BEHIND_SCALE = 0.95;
const BEHIND_OFFSET = 14;
const PROMOTE_MS = 220;

type SwipeHandle = { fly: (liked: boolean) => void };

/**
 * Una carta de la baraja. La de arriba se arrastra, gira un poco y sale
 * volando al soltarla; la de detrás espera más pequeña. Es la misma pieza de
 * detrás a delante (misma `key`), así que al pasar delante crece con suavidad
 * y con su foto ya cargada, sin parpadeo ni salto.
 */
function SwipeCard({
  concert,
  isTop,
  reason,
  onSwiped,
  onOpen,
  ref,
  muted,
  onToggleMute,
}: {
  concert: Concert;
  isTop: boolean;
  reason: string;
  onSwiped: (liked: boolean) => void;
  /** Tocar la carta (sin arrastrar): abre la ficha del concierto. */
  onOpen: () => void;
  ref?: Ref<SwipeHandle>;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  // 0 = delante, 1 = detrás. Nace ya en su sitio; solo se anima al pasar delante
  const depth = useSharedValue(isTop ? 0 : 1);
  useEffect(() => {
    depth.set(withTiming(isTop ? 0 : 1, { duration: PROMOTE_MS }));
  }, [isTop, depth]);
  const focused = useIsFocused();
  // La de detrás ya busca su canción, pero solo suena la de delante
  const { song, loading: songLoading } = useTopSong(concert.artist);
  useFadedPreview(song, focused && !muted && isTop);

  const fly = (liked: boolean) => {
    x.set(
      withTiming((liked ? 1 : -1) * width * 1.4, { duration: FLY_MS }, () => {
        scheduleOnRN(onSwiped, liked);
      })
    );
  };
  useImperativeHandle(ref, () => ({ fly }));

  // Solo la de delante responde a los dedos
  const pan = Gesture.Pan()
    .enabled(isTop)
    .onChange((e) => {
      x.set(e.translationX);
      y.set(e.translationY * 0.3);
    })
    .onEnd((e) => {
      const liked = e.translationX > 0;
      if (Math.abs(e.translationX) > SWIPE_DISTANCE || Math.abs(e.velocityX) > SWIPE_VELOCITY) {
        x.set(
          withTiming((liked ? 1 : -1) * width * 1.4, { duration: FLY_MS }, () => {
            scheduleOnRN(onSwiped, liked);
          })
        );
      } else {
        x.set(withSpring(0));
        y.set(withSpring(0));
      }
    });

  // Un toque abre la ficha; si se arrastra, gana el gesto de deslizar
  const tap = Gesture.Tap()
    .enabled(isTop)
    .onEnd((_e, success) => {
      if (success) scheduleOnRN(onOpen);
    });
  const gesture = Gesture.Exclusive(pan, tap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() + depth.get() * BEHIND_OFFSET },
      { rotate: `${interpolate(x.get(), [-width, 0, width], [-14, 0, 14])}deg` },
      { scale: 1 - depth.get() * (1 - BEHIND_SCALE) },
    ],
  }));
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [20, SWIPE_DISTANCE], [0, 1], 'clamp'),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-SWIPE_DISTANCE, -20], [1, 0], 'clamp'),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <CardContent concert={concert} reason={reason} />
        {song ? (
          <Pressable
            style={styles.song}
            onPress={onToggleMute}
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Activar el sonido' : 'Silenciar'}
          >
            <Ionicons
              name={muted ? 'volume-mute' : 'musical-notes'}
              size={14}
              color={COLORS.white}
            />
            <Text style={styles.songText} numberOfLines={1}>
              {song.title}
            </Text>
          </Pressable>
        ) : (
          // Sin canción en Apple Music (o aún buscándola): que se sepa por qué no suena
          <View style={styles.song}>
            <Ionicons name={songLoading ? 'search' : 'volume-off'} size={14} color={COLORS.white} />
            <Text style={styles.songText} numberOfLines={1}>
              {songLoading ? 'Buscando su música…' : 'Sin música disponible'}
            </Text>
          </View>
        )}
        <Animated.View style={[styles.stamp, styles.stampLike, likeStyle]}>
          <Text style={[styles.stampText, styles.stampLikeText]}>ME GUSTA</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampNope, nopeStyle]}>
          <Text style={[styles.stampText, styles.stampNopeText]}>NO</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/** Foto e información del concierto (también la carta de detrás). */
function CardContent({ concert, reason }: { concert: Concert; reason: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <>
      <ConcertImage concert={concert} prefer="hero" style={styles.photo} iconSize={90} />
      <View style={styles.info}>
        {reason ? <Text style={styles.reason}>{reason}</Text> : null}
        <Text style={styles.date}>{concert.date}</Text>
        <Text style={styles.artist} numberOfLines={2}>
          {concert.artist}
        </Text>
        <Text style={styles.venue} numberOfLines={1}>
          {concert.venue}
          {concert.price ? ` · ${concert.price}` : ''}
        </Text>
      </View>
    </>
  );
}

type Props = {
  deck: Concert[];
  weights: Record<string, number>;
  onSwipe: (concert: Concert, liked: boolean) => void;
  onMeeetIn: (concert: Concert) => void;
  onOpen: (concert: Concert) => void;
};

/**
 * Cartas de conciertos como en Tinder: derecha = te gusta, izquierda = no.
 * Abajo, los mismos gestos en botones y el gran "Meeet In!".
 */
export function ConcertDeck({ deck, weights, onSwipe, onMeeetIn, onOpen }: Props) {
  const styles = useThemedStyles(makeStyles);
  const [muted, setMuted] = useState(false);
  const [handle, setHandle] = useState<SwipeHandle | null>(null);
  const [top, next] = deck;

  // Por qué sale esta carta: el estilo que te gusta
  const reasonFor = (c: Concert) => {
    const genre = tasteGenre(c.genre);
    return genre && (weights[genre] ?? 0) > 0 ? `Porque te gusta ${genre}` : '';
  };

  if (!top) {
    return (
      <View style={styles.empty}>
        <Ionicons name="sparkles-outline" size={34} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Has visto todas las cartas</Text>
        <Text style={styles.emptyText}>
          Vuelve más tarde: cada día llegan conciertos nuevos a Barcelona.
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.stack}>
        {/* La de detrás primero (queda debajo); cada carta conserva su key al avanzar */}
        {[next, top]
          .filter((c): c is Concert => c != null)
          .map((c) => (
            <SwipeCard
              key={c.id}
              isTop={c.id === top.id}
              ref={c.id === top.id ? setHandle : undefined}
              concert={c}
              reason={reasonFor(c)}
              onSwiped={(liked) => onSwipe(c, liked)}
              onOpen={() => onOpen(c)}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
            />
          ))}

        {/* Sobre la foto, encima del texto; quietos aunque la carta se arrastre */}
        <View style={styles.controls} pointerEvents="box-none">
          <Pressable
            style={styles.round}
            onPress={() => handle?.fly(false)}
            accessibilityLabel="No me interesa"
          >
            <Ionicons name="close" size={28} color={COLORS.muted} />
          </Pressable>
          <Pressable style={styles.meeetIn} onPress={() => onMeeetIn(top)}>
            <Text style={styles.meeetInText}>Meeet In!</Text>
          </Pressable>
          <Pressable
            style={styles.round}
            onPress={() => handle?.fly(true)}
            accessibilityLabel="Me gusta"
          >
            <Ionicons name="heart" size={26} color={COLORS.peachDeep} />
          </Pressable>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    stack: { flex: 1, marginHorizontal: 16, marginBottom: 8 },
    card: {
      ...StyleSheet.absoluteFill,
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: COLORS.white,
      boxShadow: '0 12px 30px rgba(42,37,64,0.18)',
    },
    photo: { width: '100%', flex: 1, backgroundColor: COLORS.surface },
    info: { height: INFO_H, padding: 18, gap: 4 },
    reason: { color: theme.accent, fontSize: 13, fontWeight: '700' },
    date: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    artist: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    venue: { color: COLORS.muted, fontSize: 15 },
    song: {
      position: 'absolute',
      top: 14,
      left: 14,
      maxWidth: '75%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 30,
      paddingHorizontal: 12,
      borderRadius: 15,
      backgroundColor: 'rgba(42,37,64,0.55)',
    },
    songText: { color: COLORS.white, fontSize: 13, fontWeight: '600', flexShrink: 1 },
    stamp: {
      position: 'absolute',
      top: 40,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 3,
    },
    stampLike: { left: 20, borderColor: theme.accent, transform: [{ rotate: '-12deg' }] },
    stampNope: { right: 20, borderColor: COLORS.muted, transform: [{ rotate: '12deg' }] },
    stampText: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
    stampLikeText: { color: theme.accent },
    stampNopeText: { color: COLORS.muted },
    controls: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: INFO_H + 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    round: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.white,
      boxShadow: '0 6px 16px rgba(42,37,64,0.14)',
    },
    meeetIn: {
      height: 62,
      paddingHorizontal: 34,
      borderRadius: 31,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
      boxShadow: '0 8px 20px rgba(42,37,64,0.2)',
    },
    meeetInText: { color: COLORS.white, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyIcon: { color: theme.accent },
    emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginTop: 12 },
    emptyText: { color: COLORS.muted, fontSize: 15, textAlign: 'center', marginTop: 6 },
  });
