import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AVAILABILITY_LABELS, type Availability } from '@/data/concert-shifts';
import { AVAILABILITY_COLORS } from '@/theme';

const ICONS: Record<Availability, ComponentProps<typeof Ionicons>['name']> = {
  libre: 'sunny-outline',
  'tras-turno': 'time-outline',
  'antes-turno': 'time-outline',
  trabajas: 'briefcase-outline',
};

/** «Día libre» · «Tras tu turno» · «Antes de tu turno» · «Trabajas», según tus turnos. Sin disponibilidad, nada. */
export function AvailabilityPill({
  availability,
  style,
}: {
  availability: Availability | null;
  style?: StyleProp<ViewStyle>;
}) {
  if (!availability) return null;
  const { fill, ink } = AVAILABILITY_COLORS[availability];
  return (
    <View style={[styles.pill, { backgroundColor: fill }, style]}>
      <Ionicons name={ICONS[availability]} size={13} color={ink} />
      <Text style={[styles.text, { color: ink }]}>{AVAILABILITY_LABELS[availability]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  text: { fontSize: 12, fontWeight: '700', letterSpacing: -0.1 },
});
