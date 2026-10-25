import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollViewInstance,
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
import { SocialIcon } from '@/components/social-icon';
import { SongCard } from '@/components/song-card';
import { ProfileBackdrop } from '@/components/profile-backdrop';
import { ScreenHeader } from '@/components/screen-header';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { companionsLabel, isPast, splitPlans } from '@/data/plans';
import { SOCIAL_NETWORKS, SOCIAL_ORDER } from '@/data/profile';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

const COLUMNS = 3;
const GAP = 2;
const AVATAR_SIZE = 104;

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
  // Las tres columnas, una al lado de otra: se arrastran con el dedo como páginas
  // y la raya de las pestañas las sigue (pagerX / 3)
  const pager = useRef<ScrollViewInstance>(null);
  const pagerX = useAnimatedValue(0);
  // Alto de cada columna: la página mide lo que la que se ve, no lo que la más larga
  const [pageHeights, setPageHeights] = useState<Partial<Record<GridTab, number>>>({});

  const showColumn = (tab: GridTab) => {
    const i = GRID_TABS.findIndex((t) => t.key === tab);
    pager.current?.scrollTo({ x: i * width, animated: true });
    setGridTab(tab);
  };
  const onPageEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setGridTab(GRID_TABS[Math.min(Math.max(i, 0), GRID_TABS.length - 1)].key);
  };

  const { upcoming, past } = splitPlans(plans);
  const next = upcoming[0];
  const hasBackdrop = profile.created && profile.background !== 'none';
  const tilesOf: Record<GridTab, Concert[]> = { plans: upcoming, wishlist, past };
  const tileWidth = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  const socials = SOCIAL_ORDER.filter((n) => profile.socials[n]);
  // Con fondo, la canción, las redes y "Editar perfil" son de cristal: el
  // degradado se ve a través y un borde finísimo del acento las une al tema
  const pill = profile.background !== 'none' && {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${theme.accent}40`, // el acento al 25 %
  };

  // Como en Instagram: Meeet in lleva a su columna; seguidores y seguidos, a sus listas
  const openFollows = (tab: 'followers' | 'following') =>
    router.push({ pathname: '/follows', params: { tab } });
  const stats = [
    { key: 'plans', label: 'Meeet in', value: plans.length },
    { key: 'followers', label: 'Seguidores', value: profile.followers },
    { key: 'following', label: 'Seguidos', value: profile.following },
  ] as const;
  const onStat = (key: (typeof stats)[number]['key']) =>
    key === 'plans' ? showColumn('plans') : openFollows(key);

  const renderTile = (item: Concert, tab: GridTab) => {
    const gone = isPast(item);
    // En la lista de deseos aún no vas: la fecha. En tus planes, con quién vas (te incluye a ti)
    const label = tab === 'wishlist' ? item.date : companionsLabel(goingCount(item) - 1, gone);
    return (
      <Pressable
        key={item.id}
        // Un deseo que ya ha pasado se queda, más tenue
        style={[{ width: tileWidth }, tab === 'wishlist' && gone && styles.gone]}
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
  };

  return (
    <View style={styles.container}>
      {/* El fondo elegido en Editar perfil (el mismo que ven los demás) cubre todo
          el perfil, también la cuadrícula: va quieto detrás y la lista pasa por encima */}
      {hasBackdrop && <ProfileBackdrop background={profile.background} />}
      <Animated.ScrollView
        // El margen superior lo pone la cabecera fija; sin esto iOS lo suma otra vez
        contentInsetAdjustmentBehavior="never"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ top: headerHeight }}
        contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 32 }}
      >
        {
          // Sin perfil creado no hay cuadrícula: solo la tarjeta para crearlo
          !profile.created ? (
            <View style={{ paddingTop: headerHeight }}>
              <CreateProfileCard intro="Tu perfil es cómo te ve la gente que va a tus conciertos: tu foto, tu nick, tus gustos y los conciertos a los que vas. Crea el tuyo para empezar." />
            </View>
          ) : (
            <View>
              {/* Empieza bajo la cabecera de cristal, que deja ver el fondo a través */}
              <View style={{ paddingTop: headerHeight }}>
                <View style={styles.header}>
                  {/* La foto y, a su lado, el próximo concierto y los números: los dos
                      bloques ocupan juntos el alto de la foto y todo el ancho que queda */}
                  <View style={styles.summary}>
                    <ProfileAvatar
                      size={AVATAR_SIZE}
                      uri={profile.photo || undefined}
                      onPress={() => router.push('/edit-profile')}
                      rounded
                    />
                    <View style={[styles.summaryText, !next && styles.summaryCentered]}>
                      {/* Tu próximo concierto: toca para ir a su ficha */}
                      {next ? (
                        <Pressable
                          style={({ pressed }) => [styles.next, pill, pressed && styles.pressed]}
                          onPress={() =>
                            router.push({ pathname: '/concert/[id]', params: { id: next.id } })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Próximo concierto: ${next.artist}, ${next.date}, ${next.venue}`}
                        >
                          <ConcertImage concert={next} style={styles.nextImage} iconSize={16} />
                          <View style={styles.nextText}>
                            <Text style={styles.nextLabel}>Próximo concierto</Text>
                            <Text style={styles.nextArtist} numberOfLines={1}>
                              {next.artist}
                            </Text>
                            <Text style={styles.nextMeta} numberOfLines={1}>
                              {next.date}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                        </Pressable>
                      ) : null}
                      <View style={styles.stats}>
                        {stats.map((s) => (
                          <Pressable
                            key={s.label}
                            style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
                            onPress={() => onStat(s.key)}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityLabel={`${s.value} ${s.label}`}
                          >
                            <Text style={styles.statValue}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                          </Pressable>
                        ))}
                      </View>
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
                  {/* Tus estilos: salen de tus artistas y mejoran con lo que haces en la app */}
                  {myTastes.length > 0 && (
                    <View style={styles.meta}>
                      <Ionicons name="musical-notes" size={14} style={styles.metaIcon} />
                      <Text style={styles.tastesText} numberOfLines={2}>
                        {myTastes.join(' · ')}
                      </Text>
                    </View>
                  )}
                  {profile.location ? (
                    <View style={styles.meta}>
                      <Ionicons name="location-outline" size={14} style={styles.metaIcon} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {profile.location}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.bio, !profile.bio && styles.muted]}>
                    {profile.bio || 'Aún no has escrito tu biografía.'}
                  </Text>

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
                            <SocialIcon icon={icon} size={16} color={COLORS.text} />
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
                {/* La raya sigue al dedo mientras se arrastran las columnas */}
                <Animated.View
                  style={[
                    styles.gridIndicator,
                    {
                      width: width / GRID_TABS.length,
                      transform: [{ translateX: Animated.divide(pagerX, GRID_TABS.length) }],
                    },
                  ]}
                />
                {GRID_TABS.map((t) => {
                  const active = gridTab === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      style={styles.gridTab}
                      onPress={() => showColumn(t.key)}
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

              {/* Las tres columnas, como páginas: se cambian tocando la pestaña o
                  arrastrando con el dedo a un lado */}
              <Animated.ScrollView
                ref={pager}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: pagerX } } }], {
                  useNativeDriver: true,
                })}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onPageEnd}
                style={{ height: pageHeights[gridTab] }}
              >
                {GRID_TABS.map((t) => {
                  const tiles = tilesOf[t.key];
                  return (
                    <View
                      key={t.key}
                      style={[styles.page, { width }]}
                      onLayout={(e) => {
                        const h = e.nativeEvent.layout.height;
                        setPageHeights((current) =>
                          current[t.key] === h ? current : { ...current, [t.key]: h }
                        );
                      }}
                    >
                      {tiles.length > 0 ? (
                        tiles.map((item) => renderTile(item, t.key))
                      ) : (
                        <Text style={[styles.empty, { width }]}>{EMPTY_TEXT[t.key]}</Text>
                      )}
                    </View>
                  );
                })}
              </Animated.ScrollView>
            </View>
          )
        }
      </Animated.ScrollView>
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
    // Mismo alto que la foto: el concierto arriba, los números abajo, a todo lo ancho
    summaryText: { flex: 1, height: AVATAR_SIZE, justifyContent: 'space-between' },
    summaryCentered: { justifyContent: 'center' },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    metaIcon: { color: theme.accent },
    locationText: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '600' },
    next: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 6,
      paddingRight: 10,
      borderRadius: 16,
      backgroundColor: COLORS.surface,
    },
    nextImage: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.surface },
    nextText: { flex: 1 },
    nextLabel: {
      color: theme.accent,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    nextArtist: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: -0.3,
      marginTop: 1,
    },
    nextMeta: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
    // Aire entre la cabecera fija y la foto, para que respire
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    tastesText: { flex: 1, color: theme.accent, fontSize: 14, fontWeight: '700' },
    gridTabs: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
      marginBottom: GAP,
    },
    gridTab: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 12, paddingBottom: 12 },
    gridIndicator: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: 2,
      backgroundColor: theme.accent,
    },
    // Una columna: las fotos en filas de tres, pegadas
    page: { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', gap: GAP },
    gridIcon: { width: 24, height: 24 },
    gridTabText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
    gridTabTextActive: { color: theme.accent, fontWeight: '700' },
    settings: { marginLeft: 'auto', padding: 4 },
    summary: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    stats: { flexDirection: 'row', justifyContent: 'space-around' },
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
