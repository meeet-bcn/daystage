import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ShiftType } from '@/data/shifts';
import { COLORS, shiftColor } from '@/theme';

type Props = {
  /** null = libre. */
  type: ShiftType | null;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
};

/** La abreviatura de un turno sobre su color ("M", "T", "N"); libre, un guion gris. */
export function ShiftBadge({ type, size = 'medium', style }: Props) {
  const color = type ? shiftColor(type.color) : null;
  return (
    <View
      style={[styles.badge, styles[size], { backgroundColor: color?.fill ?? COLORS.surface }, style]}
    >
      <Text
        style={[styles.text, size === 'small' && styles.textSmall, { color: color?.ink ?? COLORS.muted }]}
        numberOfLines={1}
      >
        {type ? type.abbr : 'L'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  small: { minWidth: 26, height: 20, borderRadius: 10, paddingHorizontal: 5 },
  medium: { minWidth: 34, height: 28, borderRadius: 14, paddingHorizontal: 8 },
  text: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2 },
  textSmall: { fontSize: 12 },
});
