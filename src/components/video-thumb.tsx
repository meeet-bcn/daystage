import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS } from '@/theme';

type Props = { uri: string; style: StyleProp<ViewStyle>; playSize?: number };

/** Primer fotograma del vídeo (en pausa, sin sonido ni controles) con el botón de play encima. */
export function VideoThumb({ uri, style, playSize = 52 }: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
  });
  return (
    <View style={[styles.frame, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
      <View
        style={[
          styles.play,
          { width: playSize, height: playSize, borderRadius: playSize / 2 },
        ]}
      >
        <Ionicons name="play" size={playSize / 2} color={COLORS.white} style={{ marginLeft: 3 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  play: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42,37,64,0.45)',
  },
});
