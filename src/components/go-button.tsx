import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';

import { COLORS } from '@/theme';

const PARTICLES = 14;
const CONFETTI = [COLORS.accent, COLORS.peach, COLORS.lavender];

type Props = { isGoing: boolean; onPress: () => void };

export function GoButton({ isGoing, onPress }: Props) {
  const scale = useAnimatedValue(1);
  const burst = useAnimatedValue(0);

  const handlePress = () => {
    if (!isGoing) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      burst.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 0.86, duration: 90, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 3, tension: 180, useNativeDriver: true }),
        ]),
        Animated.timing(burst, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <View style={styles.wrapper}>
      {Array.from({ length: PARTICLES }).map((_, i) => {
        const angle = Math.PI + (i / (PARTICLES - 1)) * Math.PI;
        const distance = 52 + (i % 3) * 16;
        const translateX = burst.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * distance],
        });
        const translateY = burst.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * distance + 20],
        });
        const opacity = burst.interpolate({
          inputRange: [0, 0.15, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });
        const particleScale = burst.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0.2, 1, 0.5],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                backgroundColor: CONFETTI[i % CONFETTI.length],
                opacity,
                transform: [{ translateX }, { translateY }, { scale: particleScale }],
              },
            ]}
          />
        );
      })}

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={handlePress} style={[styles.button, isGoing && styles.buttonActive]}>
          {isGoing && <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />}
          <Text style={[styles.text, isGoing && styles.textActive]}>Voy</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  particle: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    pointerEvents: 'none',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 30,
    borderRadius: 23,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  buttonActive: {
    backgroundColor: COLORS.accentSoft,
    shadowOpacity: 0,
  },
  text: { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  textActive: { color: COLORS.accent },
});