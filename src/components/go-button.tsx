import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';

import { useApp } from '@/data/app-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

const PARTICLES = 14;

type Props = { isGoing: boolean; onPress: () => void };

export function GoButton({ isGoing, onPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  // Confeti con el acento de tu tema y los tonos de la marca
  const confetti = [theme.accent, COLORS.peach, COLORS.lavender];
  const { settings, profile } = useApp();
  const scale = useAnimatedValue(1);
  const burst = useAnimatedValue(0);

  const handlePress = () => {
    // Apuntarse es para quien tiene perfil (como la lista de deseos): sin él, a crearlo
    if (!profile.created) {
      router.push('/onboarding');
      return;
    }
    if (!isGoing) {
      if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                backgroundColor: confetti[i % confetti.length],
                opacity,
                transform: [{ translateX }, { translateY }, { scale: particleScale }],
              },
            ]}
          />
        );
      })}

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={handlePress} style={[styles.button, isGoing && styles.buttonActive]}>
          {isGoing && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
          <Text style={[styles.text, isGoing && styles.textActive]}>Meeet In!</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
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
      paddingHorizontal: 22,
      borderRadius: 23,
      backgroundColor: theme.accent,
      shadowColor: theme.accent,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    buttonActive: {
      backgroundColor: theme.accentSoft,
      shadowOpacity: 0,
    },
    text: { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
    textActive: { color: theme.accent },
  });
