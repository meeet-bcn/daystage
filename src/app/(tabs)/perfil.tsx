import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useAnimatedValue,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConcertImage } from '@/components/concert-image';
import { CreateProfileCard } from '@/components/create-profile-card';
import { ProfileAvatar } from '@/components/profile-avatar';
import { SongCard } from '@/components/song-card';
import { ProfileBackdrop } from '@/components/profile-backdrop';
import { ScreenHeader } from '@/components/screen-header';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { companionsLabel, isPast, splitPlans } from '@/data/plans';
import { SOCIAL_NETWORKS, SOCIAL_ORDER } from '@/data/profile';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, PROFILE_BACKGROUNDS, Theme } from '@/theme';

const COLUMNS = 3;
const GAP = 2;

// Las tres columnas de la cuadrícula, como en Instagram
type GridTab = 'plans' | 'wishlist' | 'past';
const GRID_TABS: { key: GridTab; label: string }[] = [
  { key: 'plans', label: 'Meeet in' },
  { key: 'wishlist', label: 'Lista de deseos' },
  { key: 'past', label: 'Pasados' },
];
const EMPTY_TEXT: Record<GridTab, string> = {
  plans: 'Cuando le des a «Meeet In!» en un concierto, aparecerá aquí.',
  wishlist: 'Dale al corazón de un concierto para guardarlo en tu lista de deseos.',
  past: 'Aquí quedarán los conciertos a los que ya has ido.',
};

/** Icono de cada columna: el imagotipo, un corazón y una flecha hacia atrás. */
function GridTabIcon({ tab, active }: { tab: GridTab; active: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const color = active ? theme.accent : COLORS.muted;
  if (tab === 'plans') {
    return (
      <Image
        source={
          active
            ? require('@/assets/images/tabs/meeet-in-fill.png')
            : require('@/assets/images/tabs/meeet-in.png')
        }
        style={styles.gridIcon}
        tintColor={color}
      />
    );
  }
  const name =
    tab === 'wishlist'
      ? active
        ? 'heart'
        : 'heart-outline'
      : active
        ? 'arrow-undo'
        : 'arrow-undo-outline';
  return <Ionicons name={name} size={22} color={color} />;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, plans, wishlist, goingCount, myTastes } = useApp();
  const [gridTab, setGridTab] = useState<GridTab>('plans');
  const scrollY = useAnimatedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  const { upcoming, past } = splitPlans(plans);
  const tiles = gridTab === 'plans' ? upcoming : gridTab === 'wishlist' ? wishlist : past;
  const tileWidth = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  const socials = SOCIAL_ORDER.filter((n) => profile.socials[n]);
  // Con fondo, la canción, las redes y "Editar perfil" son de cristal: el
  // degradado se ve a través y un borde finísimo del acento las une al tema
  const pill = profile.background !== 'none' && {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${theme.accent}40`, // el acento al 25 %
  };

  const stats = [
    { label: 'Meeet in', value: plans.length },
    { label: 'Seguidores', value: profile.followers },
    { label: 'Seguidos', value: profile.following },
  ];

  return (
    <View style={styles.container}>
      <Animated.FlatList
        // El margen superior lo pone la cabecera fija; sin esto iOS lo suma otra vez
        contentInsetAdjustmentBehavior="never"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ top: headerHeight }}
        // Sin perfil creado no hay cuadrícula: solo la tarjeta para crearlo
        data={profile.created ? tiles : []}
        keyExtractor={(item: Concert) => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={{ gap: GAP }}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 32 }}
        ListHeaderComponent={
          !profile.created ? (
            <View style={{ paddingTop: headerHeight }}>
              <CreateProfileCard intro="Tu perfil es cómo te ve la gente que va a tus conciertos: tu foto, tu nick, tus gustos y los conciertos a los que vas. Crea el tuyo para empezar." />
            </View>
          ) : (
            <View>
              {/* El fondo elegido en Editar perfil, el mismo que ven los demás */}
              <View
                // Empieza bajo la cabecera de cristal, que deja ver el degradado a través
                style={{ paddingTop: headerHeight }}
              >
                {profile.background !== 'none' && (
                  <ProfileBackdrop background={profile.background} />
                )}
                {/* Al tirar hacia abajo asoma lo de encima: se rellena con el color de arriba */}
                {profile.background !== 'none' && (
                  <View
                    style={[
                      styles.overscroll,
                      { backgroundColor: PROFILE_BACKGROUNDS[profile.background].from },
                    ]}
                  />
                )}
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

                  {/* Tus gustos: salen de tus artistas y mejoran con lo que haces en la app */}
                  {myTastes.length > 0 && (
                    <View style={styles.tastes}>
                      <Ionicons name="musical-notes" size={14} style={styles.tastesIcon} />
                      <Text style={styles.tastesText} numberOfLines={1}>
                        {myTastes.join(' · ')}
                      </Text>
                    </View>
                  )}

                  {profile.song ? <SongCard song={profile.song} style={pill} /> : null}

                  {socials.length > 0 && (
                    <View style={styles.socials}>
                      {socials.map((network) => {
                        const { label, icon, url } = SOCIAL_NETWORKS[network];
                        const handle = profile.socials[network];
                        return (
                          <Pressable
                            key={network}
                            style={({ pressed }) => [
                              styles.social,
                              pill,
                              pressed && styles.pressed,
                            ]}
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

                  <Pressable
                    style={[styles.editButton, pill]}
                    onPress={() => router.push('/edit-profile')}
                  >
                    <Text style={styles.editText}>Editar perfil</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.gridTabs} accessibilityRole="tablist">
                {GRID_TABS.map((t) => {
                  const active = gridTab === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      style={[styles.gridTab, active && styles.gridTabActive]}
                      onPress={() => setGridTab(t.key)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={t.label}
                    >
                      <GridTabIcon tab={t.key} active={active} />
                      <Text style={[styles.gridTabText, active && styles.gridTabTextActive]}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          profile.created ? <Text style={styles.empty}>{EMPTY_TEXT[gridTab]}</Text> : undefined
        }
        renderItem={({ item }: { item: Concert }) => {
          const gone = isPast(item);
          // En la lista de deseos aún no vas: la fecha. En tus planes, con quién vas (te incluye a ti)
          const label =
            gridTab === 'wishlist' ? item.date : companionsLabel(goingCount(item) - 1, gone);

          return (
            <Pressable
              // Un deseo que ya ha pasado se queda, más tenue
              style={[{ width: tileWidth }, gridTab === 'wishlist' && gone && styles.gone]}
              onPress={() => router.push({ pathname: '/concert/[id]', params: { id: item.id } })}
              accessibilityLabel={`${item.artist}, ${item.date}. ${label}`}
            >
              <ConcertImage concert={item} prefer="hero" style={styles.tile} iconSize={30} />
              <View style={styles.caption}>
                <Text style={styles.captionText} numberOfLines={2}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      {/* Fija arriba, de cristal: el nick y los ajustes se quedan; el resto pasa por debajo */}
      <ScreenHeader
        title={profile.nick || 'Perfil'}
        scrollY={scrollY}
        onHeight={setHeaderHeight}
        accessory={
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={10}
            style={({ pressed }) => [styles.settings, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Ajustes"
          >
            <Ionicons name="settings-outline" size={26} color={COLORS.text} />
          </Pressable>
        }
      />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    // Aire entre la cabecera fija y la foto, para que respire
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    tastes: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    tastesIcon: { color: theme.accent },
    tastesText: { flex: 1, color: theme.accent, fontSize: 14, fontWeight: '700' },
    overscroll: { position: 'absolute', left: 0, right: 0, top: -1000, height: 1000 },
    gridTabs: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
      marginBottom: GAP,
    },
    gridTab: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingTop: 12,
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    gridTabActive: { borderBottomColor: theme.accent },
    gridIcon: { width: 24, height: 24 },
    gridTabText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
    gridTabTextActive: { color: theme.accent, fontWeight: '700' },
    settings: { marginLeft: 'auto', padding: 4 },
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
