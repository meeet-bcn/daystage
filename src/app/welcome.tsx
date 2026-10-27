import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BenefitRow, PROFILE_BENEFITS } from '@/components/create-profile-card';
import { EventImage } from '@/components/event-image';
import { ImagotipoAnimado } from '@/components/imagotipo';
import { OrganicBackdrop } from '@/components/organic-backdrop';
import { useApp } from '@/data/app-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

// Diapositiva 1: artistas de ahora. Fotos de Wikimedia Commons (CC BY-SA),
// recortadas en assets/images/welcome: la licencia pide citar a sus autores
const FEATURED_ARTISTS = [
  { name: 'Bad Bunny', image: require('@/assets/images/welcome/bad-bunny.jpg') },
  { name: 'ROSALÍA', image: require('@/assets/images/welcome/rosalia.jpg') },
  { name: 'Los Planetas', image: require('@/assets/images/welcome/los-planetas.jpg') },
  { name: 'Bad Gyal', image: require('@/assets/images/welcome/bad-gyal.jpg') },
];
const PHOTO_CREDITS =
  'Fotos: Glenn Francis, Junta de Andalucía, Antonio3000 y Pedro J. Pacheco · Wikimedia Commons, CC BY-SA';

/**
 * Bienvenida: diapositivas que explican la app con piezas de la propia app y
 * fotos de conciertos de verdad. Al final, crear el perfil o entrar sin él.
 */
export default function WelcomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { concerts, finishWelcome } = useApp();
  const pager = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);

  const withPhoto = concerts.filter((c) => c.image);
  const coverTilts = [styles.cover0, styles.cover1, styles.cover2, styles.cover3];
  const featured = withPhoto[0];
  const swiped = withPhoto[1] ?? withPhoto[0];

  const slides: { title: string; text: string; art: ReactNode }[] = [
    {
      title: 'Todos los conciertos de Barcelona en un solo lugar',
      text: 'De las grandes salas a los clubs y los centros cívicos: toda la música de la ciudad, cada noche.',
      art: (
        <View style={styles.collage}>
          {FEATURED_ARTISTS.map((artist, i) => (
            <View key={artist.name} style={[styles.cover, coverTilts[i]]}>
              <Image source={artist.image} style={styles.photo} />
              <View style={styles.coverName}>
                <Text style={styles.coverNameText} numberOfLines={1}>
                  {artist.name}
                </Text>
              </View>
            </View>
          ))}
          <Text style={styles.credits}>{PHOTO_CREDITS}</Text>
        </View>
      ),
    },
    {
      title: 'Dale a «¡Voy!»',
      text: 'Di a qué conciertos vas y descubre quién más va. Comparte fotos, el setlist o lo que quieras del concierto.',
      art: featured ? (
        <View style={styles.eventCard}>
          <EventImage concert={featured} going holo />
          <View style={styles.eventBody}>
            <Text style={styles.eventDate}>{featured.date}</Text>
            <Text style={styles.eventArtist} numberOfLines={1}>
              {featured.artist}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.eventCard, styles.photoEmpty, { height: 220 }]} />
      ),
    },
    {
      title: 'Conoce a quien va',
      text: 'Cada concierto tiene su sala de chat: queda con quien va y comparte fotos, vídeos y el setlist. Ideal si estás de visita.',
      art: (
        <View style={styles.chat}>
          {/* Cabecera de la sala, como en el chat: foto del evento y miembros */}
          <View style={styles.room}>
            {featured ? (
              <Image source={{ uri: featured.image }} style={styles.roomAvatar} />
            ) : (
              <View style={[styles.roomAvatar, styles.photoEmpty]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.roomTitle} numberOfLines={1}>
                {featured?.artist ?? 'Sala del concierto'}
              </Text>
              <Text style={styles.roomText}>24 miembros</Text>
            </View>
          </View>
          <View style={[styles.bubble, styles.bubbleIn]}>
            <Text style={styles.bubbleInText}>¿Alguien más va solo?</Text>
          </View>
          <View style={[styles.bubble, styles.bubbleIn]}>
            <Text style={styles.bubbleInText}>Yo, ¡quedamos antes en la puerta!</Text>
          </View>
          <View style={[styles.bubble, styles.bubbleOut]}>
            <Text style={styles.bubbleOutText}>¡Me apunto!</Text>
          </View>
        </View>
      ),
    },
    {
      title: 'Descubre conciertos para ti',
      text: 'Desliza cartas de conciertos que encajan con tus gustos: a la derecha si te gusta, a la izquierda si no. Cuanto más la uses, mejor te conoce.',
      art: (
        <View style={styles.deck}>
          <View style={[styles.deckCard, styles.deckBehind]} />
          <View style={[styles.deckCard, styles.deckFront]}>
            {swiped ? (
              <Image source={{ uri: swiped.image }} style={styles.photo} transition={300} />
            ) : (
              <View style={[styles.photo, styles.photoEmpty]} />
            )}
            <View style={styles.deckStamp}>
              <Text style={styles.deckStampText}>ME GUSTA</Text>
            </View>
            <View style={styles.deckButtons}>
              <View style={styles.deckRound}>
                <Ionicons name="close" size={20} color={COLORS.muted} />
              </View>
              <View style={styles.deckRound}>
                <Ionicons name="heart" size={20} color={COLORS.peachDeep} />
              </View>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: '¿Te creas el perfil?',
      text: 'Es un momento. Y si no, puedes hacerlo más tarde desde Perfil.',
      art: (
        <View style={styles.benefits}>
          {PROFILE_BENEFITS.map((b) => (
            <BenefitRow key={b.text} {...b} />
          ))}
        </View>
      ),
    },
  ];
  const last = page === slides.length - 1;

  const onPage = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  const next = () => pager.current?.scrollTo({ x: (page + 1) * width, animated: true });

  const createProfile = () => router.replace('/onboarding');
  const skip = () => {
    finishWelcome();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <OrganicBackdrop />

      <View style={[styles.brand, { marginTop: insets.top + 12 }]}>
        <ImagotipoAnimado height={56} />
      </View>
      <Text style={styles.logo}>
        daystage<Text style={{ color: COLORS.accent }}>.</Text>
      </Text>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPage}
        style={styles.pager}
      >
        {slides.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={styles.art}>{slide.art}</View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.text}>{slide.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.title} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        {last ? (
          <>
            <Pressable style={styles.primary} onPress={createProfile}>
              <Text style={styles.primaryText}>Crear mi perfil</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={skip} hitSlop={8}>
              <Text style={styles.secondaryText}>Ahora no</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.primary} onPress={next}>
            <Text style={styles.primaryText}>Siguiente</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.mist },
    brand: { alignSelf: 'center' },
    logo: {
      alignSelf: 'center',
      color: COLORS.text,
      fontSize: 52,
      lineHeight: 60,
      fontWeight: '700',
      letterSpacing: -1.6,
      marginTop: 6,
    },
    pager: { flex: 1 },
    slide: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
    art: { height: 270, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
    title: {
      color: COLORS.text,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.6,
      textAlign: 'center',
    },
    text: {
      color: COLORS.muted,
      fontSize: 17,
      lineHeight: 24,
      textAlign: 'center',
      marginTop: 12,
    },
    // Diapositiva 1: cuatro portadas de artistas de ahora, ladeadas
    collage: { width: 300, height: 260 },
    cover: {
      position: 'absolute',
      width: 136,
      height: 136,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 4,
      borderColor: COLORS.white,
      boxShadow: '0 10px 30px rgba(42,37,64,0.18)',
    },
    cover0: { left: 6, top: 0, transform: [{ rotate: '-7deg' }] },
    cover1: { right: 6, top: 14, transform: [{ rotate: '6deg' }] },
    cover2: { left: 20, bottom: 0, transform: [{ rotate: '4deg' }] },
    cover3: { right: 22, bottom: 8, transform: [{ rotate: '-5deg' }] },
    coverName: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: 'rgba(255,255,255,0.88)',
    },
    credits: {
      position: 'absolute',
      bottom: -26,
      left: -20,
      right: -20,
      color: COLORS.muted,
      fontSize: 10,
      textAlign: 'center',
    },
    coverNameText: { color: COLORS.text, fontSize: 12, fontWeight: '800', textAlign: 'center' },
    photo: { width: '100%', height: '100%' },
    photoEmpty: { backgroundColor: COLORS.lavender },
    // Diapositiva 2: un concierto de verdad, con "¡Voy!"
    eventCard: {
      width: '100%',
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: COLORS.white,
      boxShadow: '0 12px 32px rgba(42,37,64,0.16)',
    },
    eventBody: { padding: 14 },
    eventDate: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    eventArtist: { color: COLORS.text, fontSize: 19, fontWeight: '700', marginTop: 4 },
    // Diapositiva 3: chat de ejemplo
    chat: {
      width: '100%',
      padding: 16,
      gap: 8,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.85)',
      boxShadow: '0 12px 32px rgba(42,37,64,0.12)',
    },
    room: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingBottom: 10,
      marginBottom: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
    },
    roomAvatar: { width: 36, height: 36, borderRadius: 18 },
    roomTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
    roomText: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
    bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
    bubbleIn: {
      alignSelf: 'flex-start',
      backgroundColor: COLORS.surface,
      borderBottomLeftRadius: 6,
    },
    bubbleOut: { alignSelf: 'flex-end', backgroundColor: theme.accent, borderBottomRightRadius: 6 },
    bubbleInText: { color: COLORS.text, fontSize: 15 },
    bubbleOutText: { color: COLORS.white, fontSize: 15 },
    // Diapositiva 4: Descubrir, una carta deslizándose
    deck: { width: 230, height: 260 },
    deckCard: {
      position: 'absolute',
      width: 210,
      height: 250,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: COLORS.white,
      boxShadow: '0 12px 30px rgba(42,37,64,0.16)',
    },
    deckBehind: {
      left: 0,
      top: 6,
      transform: [{ rotate: '-6deg' }],
      backgroundColor: theme.accentSoft,
    },
    deckFront: { right: 0, top: 0, transform: [{ rotate: '7deg' }] },
    deckStamp: {
      position: 'absolute',
      top: 18,
      left: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 3,
      borderColor: theme.accent,
      backgroundColor: 'rgba(255,255,255,0.7)',
      transform: [{ rotate: '-12deg' }],
    },
    deckStampText: { color: theme.accent, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    deckButtons: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 14,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 18,
    },
    deckRound: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.white,
    },
    // Diapositiva 5: lo que ganas con el perfil
    benefits: { width: '100%', gap: 12 },
    footer: { paddingHorizontal: 28, gap: 14, alignItems: 'center' },
    dots: { flexDirection: 'row', gap: 6, marginBottom: 6 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(42,37,64,0.18)' },
    dotActive: { width: 22, backgroundColor: theme.accent },
    primary: {
      alignSelf: 'stretch',
      height: 54,
      borderRadius: 27,
      backgroundColor: COLORS.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
    secondary: { paddingVertical: 4 },
    secondaryText: { color: COLORS.muted, fontSize: 15, fontWeight: '600' },
  });
