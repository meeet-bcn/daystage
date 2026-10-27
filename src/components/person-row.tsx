import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/profile-avatar';
import { displayName, type PublicProfile } from '@/data/social';
import { useSocial } from '@/data/social-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

type Props = {
  person: PublicProfile;
  /** Sin botón de seguir (p. ej. tú mismo en la lista de la sala). */
  hideFollow?: boolean;
  /** Texto pequeño bajo el nombre (si no, @nick). */
  detail?: string;
  /** Algo más a la derecha (p. ej. el menú de denunciar o bloquear). */
  accessory?: ReactNode;
  onLongPress?: () => void;
};

/** Una persona: foto, nombre, @nick y «Seguir» / «Siguiendo». */
export function PersonRow({ person, hideFollow = false, detail, accessory, onLongPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { isFollowing, follow, unfollow } = useSocial();
  const following = isFollowing(person.id);
  return (
    <Pressable style={styles.row} onLongPress={onLongPress} disabled={!onLongPress}>
      <ProfileAvatar size={44} uri={person.photo ?? undefined} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName(person)}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {detail ?? (person.nick ? `@${person.nick}` : '')}
        </Text>
      </View>
      {!hideFollow && (
        <Pressable
          onPress={() => (following ? unfollow(person.id) : follow(person))}
          style={[styles.button, following && styles.buttonFollowing]}
          accessibilityRole="button"
          accessibilityLabel={following ? `Dejar de seguir a ${displayName(person)}` : `Seguir a ${displayName(person)}`}
        >
          <Text style={[styles.buttonText, following && styles.buttonTextFollowing]}>
            {following ? 'Siguiendo' : 'Seguir'}
          </Text>
        </Pressable>
      )}
      {accessory}
    </Pressable>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    text: { flex: 1 },
    name: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    detail: { color: COLORS.muted, fontSize: 13, marginTop: 1 },
    button: {
      height: 34,
      paddingHorizontal: 16,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    buttonFollowing: { backgroundColor: COLORS.surface },
    buttonText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
    buttonTextFollowing: { color: COLORS.text },
  });
