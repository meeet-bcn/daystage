import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useApp } from '@/data/app-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

type Props = { isGoing: boolean; onPress: () => void };

/** «¡Voy!»: sin animaciones, solo la vibración y el cambio de estado. */
export function GoButton({ isGoing, onPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const { settings, profile } = useApp();

  const handlePress = () => {
    // Apuntarse es para quien tiene perfil (como la lista de deseos): sin él, a crearlo
    if (!profile.created) {
      router.push('/onboarding');
      return;
    }
    if (settings.haptics) {
      if (isGoing) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.button, isGoing && styles.buttonActive, pressed && styles.pressed]}
    >
      {isGoing && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
      <Text style={[styles.text, isGoing && styles.textActive]}>{isGoing ? 'Voy ✓' : '¡Voy!'}</Text>
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 46,
      paddingHorizontal: 22,
      borderRadius: 23,
      backgroundColor: theme.accent,
    },
    buttonActive: { backgroundColor: theme.accentSoft },
    pressed: { opacity: 0.8 },
    text: { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
    textActive: { color: theme.accent },
  });
