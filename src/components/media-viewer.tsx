import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { saveToGallery } from '@/data/save-media';
import { COLORS } from '@/theme';

// Ajustes del visor
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DISMISS_DISTANCE = 110; // pt arrastrados para cerrar
const DISMISS_VELOCITY = 900; // o un gesto rápido

export type Media = { uri: string; kind: 'photo' | 'video' };

type Props = { media: Media | null; onClose: () => void };

/**
 * Foto o vídeo a pantalla completa, como en la galería: la foto con zoom
 * (dos dedos o doble toque) y se quita deslizándola a un lado o hacia abajo;
 * el vídeo se reproduce con los controles del sistema. Arriba, ✕ para salir
 * y guardar en la galería. `media` null = cerrado.
 */
export function MediaViewer({ media, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');

  const close = () => {
    setSaving('idle');
    onClose();
  };

  const save = async () => {
    if (!media || saving !== 'idle') return;
    setSaving('saving');
    try {
      const ok = await saveToGallery(media.uri, media.kind);
      if (!ok) {
        Alert.alert(
          'Sin permiso para guardar',
          'Permite a meeet guardar en Fotos desde los ajustes del móvil.',
        );
      }
      setSaving(ok ? 'saved' : 'idle');
    } catch (e) {
      setSaving('idle');
      Alert.alert('No se ha podido guardar', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Modal
      visible={media != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      {/* Dentro de un Modal los gestos necesitan su propia raíz */}
      <GestureHandlerRootView style={styles.root}>
        {media?.kind === 'photo' && <ZoomablePhoto key={media.uri} uri={media.uri} onDismiss={close} />}
        {media?.kind === 'video' && <FullVideo key={media.uri} uri={media.uri} />}

        <View style={[styles.bar, { top: insets.top + 10 }]} pointerEvents="box-none">
          <Pressable
            onPress={save}
            hitSlop={12}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel={saving === 'saved' ? 'Guardado en Fotos' : 'Guardar en Fotos'}
          >
            {saving === 'saving' ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Ionicons
                name={saving === 'saved' ? 'checkmark' : 'download-outline'}
                size={22}
                color={COLORS.white}
              />
            )}
          </Pressable>
          <Pressable
            onPress={close}
            hitSlop={12}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ZoomablePhoto({ uri, onDismiss }: { uri: string; onDismiss: () => void }) {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  // Arrastre para cerrar (solo sin zoom)
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const resetZoom = () => {
    'worklet';
    scale.set(withTiming(1));
    savedScale.set(1);
    x.set(withTiming(0));
    y.set(withTiming(0));
    savedX.set(0);
    savedY.set(0);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.set(Math.min(MAX_ZOOM, Math.max(1, savedScale.get() * e.scale)));
    })
    .onEnd(() => {
      if (scale.get() < 1.05) resetZoom();
      else savedScale.set(scale.get());
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (savedScale.get() > 1) {
        // Con zoom, mover la foto sin salirse de sus bordes
        const maxX = ((scale.get() - 1) * width) / 2;
        const maxY = ((scale.get() - 1) * height) / 2;
        x.set(Math.min(maxX, Math.max(-maxX, savedX.get() + e.translationX)));
        y.set(Math.min(maxY, Math.max(-maxY, savedY.get() + e.translationY)));
      } else {
        dragX.set(e.translationX);
        dragY.set(e.translationY);
      }
    })
    .onEnd((e) => {
      if (savedScale.get() > 1) {
        savedX.set(x.get());
        savedY.set(y.get());
        return;
      }
      const sideways =
        Math.abs(e.translationX) > DISMISS_DISTANCE || Math.abs(e.velocityX) > DISMISS_VELOCITY;
      const down = e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY;
      if (sideways || down) {
        // Sale por donde se ha lanzado y luego se cierra
        if (sideways) dragX.set(withTiming(Math.sign(e.translationX || e.velocityX) * width, { duration: 180 }));
        if (down) dragY.set(withTiming(height, { duration: 180 }));
        scale.set(withTiming(0.9, { duration: 180 }, () => scheduleOnRN(onDismiss)));
      } else {
        dragX.set(withSpring(0));
        dragY.set(withSpring(0));
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (savedScale.get() > 1) {
        resetZoom();
        return;
      }
      // Acerca hacia el punto tocado
      const toX = (width / 2 - e.x) * (DOUBLE_TAP_ZOOM - 1);
      const toY = (height / 2 - e.y) * (DOUBLE_TAP_ZOOM - 1);
      const maxX = ((DOUBLE_TAP_ZOOM - 1) * width) / 2;
      const maxY = ((DOUBLE_TAP_ZOOM - 1) * height) / 2;
      const clampedX = Math.min(maxX, Math.max(-maxX, toX));
      const clampedY = Math.min(maxY, Math.max(-maxY, toY));
      scale.set(withTiming(DOUBLE_TAP_ZOOM));
      savedScale.set(DOUBLE_TAP_ZOOM);
      x.set(withTiming(clampedX));
      y.set(withTiming(clampedY));
      savedX.set(clampedX);
      savedY.set(clampedY);
    });

  const gesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.max(Math.abs(dragX.get()), Math.abs(dragY.get())), [0, 300], [1, 0.2], 'clamp'),
  }));
  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() + dragX.get() },
      { translateY: y.get() + dragY.get() },
      { scale: scale.get() },
    ],
  }));

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ width, height }, photoStyle]} accessibilityLabel="Foto">
          <Image source={{ uri }} style={{ width, height }} contentFit="contain" />
        </Animated.View>
      </GestureDetector>
    </>
  );
}

function FullVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => p.play());
  return (
    <View style={[StyleSheet.absoluteFill, styles.backdrop]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
        fullscreenOptions={{ enable: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { backgroundColor: COLORS.black },
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
