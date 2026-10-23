import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile-avatar';
import { SongCard } from '@/components/song-card';
import { ScreenTitle } from '@/components/screen-title';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { companionsLabel, isPast, splitPlans } from '@/data/plans';
import { SOCIAL_NETWORKS, SOCIAL_ORDER } from '@/data/profile';
import { COLORS } from '@/theme';

const COLUMNS = 3;
const GAP = 2;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, plans, goingCount } = useApp();

  const { upcoming, past } = splitPlans(plans);
  const tiles = [...upcoming, ...past];
  const tileWidth = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  const socials = SOCIAL_ORDER.filter((n) => profile.socials[n]);

  const stats = [
    { label: 'Meeet in', value: plans.length },
    { label: 'Seguidores', value: profile.followers },
    { label: 'Seguidos', value: profile.following },
  ];

  return (
    <FlatList
      // El margen superior lo pone ScreenTitle; sin esto iOS lo suma otra vez
      contentInsetAdjustmentBehavior="never"
      style={styles.container}
      data={tiles}
      keyExtractor={(item: Concert) => item.id}
      numColumns={COLUMNS}
      columnWrapperStyle={{ gap: GAP }}
      ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 32 }}
      ListHeaderComponent={
        <View>
          {/* Mismo título que Descubrir y meeet in */}
          <ScreenTitle title={profile.nick || 'Perfil'} />

          <View style={styles.header}>
            <View style={styles.summary}>
              <ProfileAvatar
                size={86}
                uri={profile.photo || undefined}
                onPress={() => router.push('/edit-profile')}
              />
              <View style={styles.stats}>
                {stats.map((s) => (
                  <View key={s.label} style={styles.stat}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {profile.name || profile.pronouns ? (
              <Text style={styles.name}>
                {profile.name}
                {/* Los pronombres, en gris y más pequeños, junto al nombre */}
                {profile.pronouns ? (
                  <Text style={styles.pronouns}>
                    {profile.name ? '  ' : ''}
                    {profile.pronouns}
                  </Text>
                ) : null}
              </Text>
            ) : null}
            <Text style={[styles.bio, !profile.bio && styles.muted]}>
              {profile.bio || 'Aún no has escrito tu biografía.'}
            </Text>

            {profile.song ? <SongCard song={profile.song} /> : null}

            {socials.length > 0 && (
              <View style={styles.socials}>
                {socials.map((network) => {
                  const { label, icon, url } = SOCIAL_NETWORKS[network];
                  const handle = profile.socials[network];
                  return (
                    <Pressable
                      key={network}
                      style={({ pressed }) => [styles.social, pressed && styles.pressed]}
                      // El enlace web abre la app de la red si está instalada
                      onPress={() => Linking.openURL(url(handle))}
                      accessibilityRole="link"
                      accessibilityLabel={`${label}: @${handle}`}
                    >
                      <Ionicons name={icon} size={16} color={COLORS.text} />
                      <Text style={styles.socialText} numberOfLines={1}>
                        {handle}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Pressable style={styles.editButton} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editText}>Editar perfil</Text>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          Cuando le des a «Meeet In!» en un concierto, aparecerá aquí. Los que ya hayan pasado se quedan, más
          tenues.
        </Text>
      }
      renderItem={({ item }: { item: Concert }) => {
        const gone = isPast(item);
        const uri = item.hero || item.image;
        // goingCount te incluye a ti
        const label = companionsLabel(goingCount(item) - 1, gone);

        return (
          <Pressable
            style={[{ width: tileWidth }, gone && styles.gone]}
            onPress={() => router.push({ pathname: '/concert/[id]', params: { id: item.id } })}
            accessibilityLabel={`${item.artist}, ${item.date}. ${label}`}
          >
            {uri ? <Image source={{ uri }} style={styles.tile} /> : <View style={styles.tile} />}
            <View style={styles.caption}>
              <Text style={styles.captionText} numberOfLines={2}>
                {label}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  name: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginTop: 14 },
  pronouns: { color: COLORS.muted, fontSize: 13, fontWeight: '500' },
  bio: { color: COLORS.text, fontSize: 15, lineHeight: 21, marginTop: 6 },
  socials: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  social: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    maxWidth: '100%',
  },
  socialText: { color: COLORS.text, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  pressed: { opacity: 0.6 },
  muted: { color: COLORS.muted },
  editButton: {
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  editText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  empty: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  tile: { width: '100%', aspectRatio: 3 / 4, backgroundColor: COLORS.surface },
  gone: { opacity: 0.5 },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  captionText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
});
