import { router } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile-avatar';
import { ScreenTitle } from '@/components/screen-title';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { companionsLabel, isPast, splitPlans } from '@/data/plans';
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
              <ProfileAvatar size={86} uri={profile.photo || undefined} />
              <View style={styles.stats}>
                {stats.map((s) => (
                  <View key={s.label} style={styles.stat}>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {profile.name ? <Text style={styles.name}>{profile.name}</Text> : null}
            <Text style={[styles.bio, !profile.bio && styles.muted]}>
              {profile.bio || 'Aún no has escrito tu biografía.'}
            </Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          Cuando digas «Voy» a un concierto, aparecerá aquí. Los que ya hayan pasado se quedan, más
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
  bio: { color: COLORS.text, fontSize: 15, lineHeight: 21, marginTop: 6 },
  muted: { color: COLORS.muted },
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
