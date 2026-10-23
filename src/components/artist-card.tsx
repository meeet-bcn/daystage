import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/chip';
import type { ArtistLinkKind } from '@/data/musicbrainz';
import { useArtistInfo } from '@/hooks/use-artist-info';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

const LINKS: Record<
  ArtistLinkKind,
  { label: string; icon: ComponentProps<typeof Ionicons>['name'] }
> = {
  spotify: { label: 'Spotify', icon: 'musical-notes' },
  apple: { label: 'Apple Music', icon: 'logo-apple' },
  youtube: { label: 'YouTube', icon: 'logo-youtube' },
  instagram: { label: 'Instagram', icon: 'logo-instagram' },
  tiktok: { label: 'TikTok', icon: 'logo-tiktok' },
  bandcamp: { label: 'Bandcamp', icon: 'disc' },
  soundcloud: { label: 'SoundCloud', icon: 'cloud' },
  web: { label: 'Web', icon: 'globe-outline' },
};

type Props = { eventName: string; genre: string };

/** "Sobre el artista": datos de MusicBrainz. No pinta nada si no se encuentra. */
export function ArtistCard({ eventName, genre }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { info, loading } = useArtistInfo(eventName, genre);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={COLORS.muted} />
      </View>
    );
  }
  if (!info) return null;

  const facts = [info.type, info.country, info.since && `Desde ${info.since}`].filter(Boolean);
  if (facts.length === 0 && info.genres.length === 0 && info.links.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Sobre el artista</Text>
      <Text style={styles.name}>{info.name}</Text>
      {facts.length > 0 && <Text style={styles.facts}>{facts.join(' · ')}</Text>}

      {info.genres.length > 0 && (
        <View style={styles.genres}>
          {info.genres.map((g) => (
            <Text key={g} style={styles.genre}>
              {g}
            </Text>
          ))}
        </View>
      )}

      {info.links.length > 0 && (
        <View style={styles.links}>
          {info.links.map((link) => (
            <Chip
              key={link.kind}
              icon={LINKS[link.kind].icon}
              label={LINKS[link.kind].label}
              onPress={() => Linking.openURL(link.url)}
            />
          ))}
        </View>
      )}

      <Text style={styles.credit}>Datos de MusicBrainz</Text>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    loading: { paddingVertical: 28 },
    card: { marginTop: 28 },
    sectionTitle: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    name: {
      color: COLORS.text,
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.3,
      marginTop: 8,
    },
    facts: { color: COLORS.muted, fontSize: 15, marginTop: 2 },
    genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
    genre: {
      color: theme.accent,
      backgroundColor: theme.accentSoft,
      fontSize: 13,
      fontWeight: '600',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
    links: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    credit: { color: COLORS.muted, fontSize: 11, marginTop: 14 },
  });
