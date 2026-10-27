import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
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

import { DayStageLogo } from '@/components/daystage-mark';
import { useApp } from '@/data/app-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { BRAND_GRADIENT, COLORS, Theme } from '@/theme';

const ICON_CIRCLE = 132;
const ICON_SIZE = 60;

/** Qué es DayStage, en cuatro ideas: un icono grande, un título corto y una línea. */
const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  {
    icon: 'calendar-outline',
    title: 'Tus turnos, a la vista',
    text: 'Mañanas, tardes y noches en un calendario claro.',
  },
  {
    icon: 'musical-notes-outline',
    title: 'Conciertos que te encajan',
    text: 'Los que caen en tus días libres o después de tu turno.',
  },
  {
    icon: 'people-outline',
    title: 'Planes con amigos',
    text: 'Dale a «¡Voy!», mira quién va y habla en la sala del concierto.',
  },
  {
    icon: 'stats-chart-outline',
    title: 'Horas y avisos',
    text: 'Tus horas del mes y un aviso antes de cada turno o concierto.',
  },
];

/**
 * Bienvenida: qué es DayStage en cuatro diapositivas minimalistas. Sin pedir
 * perfil ni cuenta: «Empezar» entra directamente en la app (el perfil se pide
 * luego, cuando hace falta).
 */
export default function WelcomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { finishWelcome } = useApp();
  const pager = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const last = page === SLIDES.length - 1;

  const onPage = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  const next = () => pager.current?.scrollTo({ x: (page + 1) * width, animated: true });
  const start = () => {
    finishWelcome();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.brand, { marginTop: insets.top + 20 }]}>
        <DayStageLogo size={26} />
      </View>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPage}
        style={styles.pager}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={styles.iconCircle}>
              <Ionicons name={slide.icon} size={ICON_SIZE} color={COLORS.white} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.text}>{slide.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.title} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.primary} onPress={last ? start : next}>
          <Text style={styles.primaryText}>{last ? 'Empezar' : 'Siguiente'}</Text>
        </Pressable>
        <Pressable onPress={start} hitSlop={8} style={[styles.skip, last && styles.hidden]} disabled={last}>
          <Text style={styles.skipText}>Saltar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    brand: { alignSelf: 'center' },
    pager: { flex: 1 },
    slide: { flex: 1, paddingHorizontal: 36, alignItems: 'center', justifyContent: 'center' },
    iconCircle: {
      width: ICON_CIRCLE,
      height: ICON_CIRCLE,
      borderRadius: ICON_CIRCLE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 40,
      backgroundColor: COLORS.stageMagenta,
      experimental_backgroundImage: BRAND_GRADIENT,
    },
    title: {
      color: COLORS.text,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.6,
      textAlign: 'center',
    },
    text: {
      color: COLORS.muted,
      fontSize: 17,
      lineHeight: 24,
      textAlign: 'center',
      marginTop: 10,
    },
    footer: { paddingHorizontal: 28, gap: 14, alignItems: 'center' },
    dots: { flexDirection: 'row', gap: 6, marginBottom: 6 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.line },
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
    skip: { paddingVertical: 4 },
    hidden: { opacity: 0 },
    skipText: { color: COLORS.muted, fontSize: 15, fontWeight: '600' },
  });
