import { FontAwesome, Ionicons } from '@expo/vector-icons';

import type { SocialIconName } from '@/data/profile';

type Props = { icon: SocialIconName; size: number; color: string };

/** Icono de una red social: de Ionicons, salvo Spotify (no está), de FontAwesome. */
export function SocialIcon({ icon, size, color }: Props) {
  return icon.family === 'fontawesome' ? (
    <FontAwesome name={icon.name} size={size} color={color} />
  ) : (
    <Ionicons name={icon.name} size={size} color={color} />
  );
}
