import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BenefitRow, PROFILE_BENEFITS } from '@/components/create-profile-card';
import { EventImage } from '@/components/event-image';
import { OrganicBackdrop } from '@/components/organic-backdrop';
import { useApp } from '@/data/app-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, PROFILE_BACKGROUNDS, ProfileBackground, profileGradient, Theme } from '@/theme';

// Fondos de muestra en la diapositiva del perfil
const SAMPLE_BACKGROUNDS: ProfileBackground[] = ['aurora', 'menta', 'mandarina', 'cielo', 'rosa'];

/**
 * Bienvenida: diapositivas que explican la app con piezas de la propia app y
 * fotos de conciertos de verdad. Al final, crear el perfil o entrar sin él.
 */
export default function WelcomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { concerts, finishWelcome } = useApp();
  const pager = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const withPhoto = concerts.filter((c) => c.image);
  const photoTilts = [styles.photo0, styles.photo1, styles.photo2];
  const photos = withPhoto.slice(0, 3);
  const featured = withPhoto[3] ?? withPhoto[0];

  const slides: { title: string; text: string; art: ReactNode }[] = [
    {
      title: 'Todos los conciertos de Barcelona',
      text: 'Cada noche hay música en la ciudad. Aquí la tienes toda, en un solo sitio.',
      art: (
        <View style={styles.collage}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.photoCard, photoTilts[i]]}>
              {photos[i] ? (
                <Image source={{ uri: photos[i].image }} style={styles.photo} transition={300} />
              ) : (
                <View style={[styles.photo, styles.photoEmpty]} />
              )}
            </View>
          ))}
        </View>
      ),
    },
    {
      title: 'Dale a «Meeet In!»',
      text: 'Di a qué conciertos vas. Así sabrás quién más va y podrás ir juntos.',
      art: featured ? (
        <View style={styles.eventCard}>
          <EventImage concert={featured} going holo showSource={false} />
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
      text: 'Cada concierto tiene su chat: uno general y otro en tu idioma. Ideal si estás de visita.',
      art: (
        <View style={styles.chat}>
          <View style={styles.rooms}>
            <View style={[styles.room, styles.roomActive]}>
              <Text style={styles.roomTextActive}>General</Text>
            </View>
            <View style={styles.room}>
              <Ionicons name="language" size={13} color={COLORS.muted} />
              <Text style={styles.roomText}>English</Text>
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
      title: 'Tu perfil, tu color',
      text: 'Elige tu foto, tu fondo y tu canción. El color que elijas tiñe toda la app.',
      art: (
        <View style={styles.profileArt}>
          <View
            style={[
              styles.profileCard,
              { experimental_backgroundImage: profileGradient('mandarina') },
            ]}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color={COLORS.muted} />
            </View>
            <Text style={styles.profileNick}>
              tu_nick<Text style={{ color: PROFILE_BACKGROUNDS.mandarina.accent }}>.</Text>
            </Text>
          </View>
          <View style={styles.swatches}>
            {SAMPLE_BACKGROUNDS.map((key) => (
              <View
                key={key}
                style={[styles.swatch, { experimental_backgroundImage: profileGradient(key) }]}
              />
            ))}
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

      <Text style={[styles.logo, { marginTop: insets.top + 16 }]}>
        m<Text style={{ color: COLORS.peach }}>e</Text>
        <Text style={{ color: COLORS.peachMid }}>e</Text>
        <Text style={{ color: COLORS.peachDeep }}>e</Text>t
        <Text style={{ color: COLORS.accent }}>.</Text>
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
    logo: {
      alignSelf: 'center',
      color: COLORS.text,
      fontSize: 34,
      fontWeight: '700',
      letterSpacing: -0.8,
    },
    pager: { flex: 1 },
    slide: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
    art: { height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
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
    // Diapositiva 1: tres fotos de conciertos, ladeadas
    collage: { width: 300, height: 280 },
    photoCard: {
      position: 'absolute',
      width: 190,
      height: 130,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 4,
      borderColor: COLORS.white,
      boxShadow: '0 10px 30px rgba(42,37,64,0.18)',
    },
    photo0: { left: 0, top: 10, transform: [{ rotate: '-8deg' }] },
    photo1: { right: 0, top: 70, transform: [{ rotate: '6deg' }] },
    photo2: { left: 40, top: 150, transform: [{ rotate: '-2deg' }] },
    photo: { width: '100%', height: '100%' },
    photoEmpty: { backgroundColor: COLORS.lavender },
    // Diapositiva 2: un concierto de verdad, con "Meeet In!"
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
    rooms: {
      flexDirection: 'row',
      padding: 3,
      borderRadius: 12,
      backgroundColor: COLORS.surface,
      marginBottom: 6,
    },
    room: {
      flex: 1,
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
      justifyContent: 'center',
      height: 30,
      borderRadius: 9,
    },
    roomActive: { backgroundColor: COLORS.white },
    roomText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
    roomTextActive: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
    bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
    bubbleIn: {
      alignSelf: 'flex-start',
      backgroundColor: COLORS.surface,
      borderBottomLeftRadius: 6,
    },
    bubbleOut: { alignSelf: 'flex-end', backgroundColor: theme.accent, borderBottomRightRadius: 6 },
    bubbleInText: { color: COLORS.text, fontSize: 15 },
    bubbleOutText: { color: COLORS.white, fontSize: 15 },
    // Diapositiva 4: un perfil con fondo y las muestras
    profileArt: { alignItems: 'center', gap: 20 },
    profileCard: {
      width: 240,
      paddingVertical: 28,
      borderRadius: 24,
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 12px 32px rgba(42,37,64,0.14)',
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.7)',
    },
    profileNick: { color: COLORS.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
    swatches: { flexDirection: 'row', gap: 10 },
    swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: COLORS.white },
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
