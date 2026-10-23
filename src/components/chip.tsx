import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

type Props = {
  label: string;
  active?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

export function Chip({ label, active = false, icon, onPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
    >
      {icon && <Ionicons name={icon} size={16} color={active ? theme.accent : COLORS.text} />}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: COLORS.surface,
    },
    chipActive: { backgroundColor: theme.accentSoft },
    pressed: { opacity: 0.7 },
    label: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
    labelActive: { color: theme.accent },
  });
