import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConcertDeck } from '@/components/concert-deck';
import { CreateProfileCard } from '@/components/create-profile-card';
import { ScreenHeader } from '@/components/screen-header';
import { TastePicker } from '@/components/taste-picker';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { buildDeck, keepAhead, TASTE_PICKS, tasteWeights, topTastes } from '@/data/taste';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

/** Pantalla de explicación de Descubrir (antes de elegir artistas y antes de las cartas). */
function Explainer({
  icon,
  title,
  children,
  action,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
  action: string;
  onAction: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView contentContainerStyle={styles.explainer}>
      <View style={styles.explainerIcon}>
        <Ionicons name={icon} size={34} style={styles.explainerIconColor} />
      </View>
      <Text style={styles.explainerTitle}>{title}</Text>
      {children}
      <Pressable style={styles.primary} onPress={onAction}>
        <Text style={styles.primaryText}>{action}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Point({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.point}>
      <Ionicons name={icon} size={20} style={styles.pointIcon} />
      <Text style={styles.pointText}>{text}</Text>
    </View>
  );
}

/**
 * Descubrir, como un Tinder de conciertos. Hace falta perfil; la primera vez
 * se explica para qué sirve, eliges 5 artistas (de ahí salen tus gustos) y se
 * explica cómo van las cartas. Después, cartas de conciertos de Barcelona
 * ordenadas por lo que más encaja contigo, que aprende de lo que haces.
 */
export default function DiscoverScreen() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const scrollY = useAnimatedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [picking, setPicking] = useState(false);
  const [now] = useState(() => Date.now());
  // Las cartas que ya se ven (delante y la que asoma detrás): no se reordenan al deslizar
  const [ahead, setAhead] = useState<string[]>([]);
  const {
    profile,
    updateProfile,
    concerts,
    plans,
    swipes,
    swipe,
    deckIntroSeen,
    finishDeckIntro,
    tasteWeights: weights,
    isGoing,
    toggleGoing,
    isWished,
    toggleWish,
    settings,
    availability,
  } = useApp();

  const hasTastes = profile.tasteArtists.length >= TASTE_PICKS;
  const deck = keepAhead(
    buildDeck(concerts, weights, {
      now,
      swiped: new Set(Object.keys(swipes)),
      going: new Set(plans.map((c) => c.id)),
      // DayStage: suben los conciertos de tus días libres
      availability,
    }),
    ahead
  );
  // Al quitar una carta, las dos siguientes se quedan fijas: la de detrás pasa delante
  // tal cual, aunque los gustos (que cambian al deslizar) ordenen el resto de otra forma
  const pinAfter = (concert: Concert) =>
    setAhead(
      deck
        .filter((c) => c.id !== concert.id)
        .slice(0, 2)
        .map((c) => c.id)
    );

  const finishPicking = (picks: string[]) => {
    // Tus gustos en el perfil: lo que ya habías elegido más lo que se deduce de los artistas
    const derived = topTastes(tasteWeights({ picks, plans: [], wishlist: [], swipes: {} }));
    updateProfile({
      tasteArtists: picks,
      tastes: [...new Set([...derived, ...profile.tastes])],
    });
    setPicking(false);
  };

  // Derecha: te gusta (a tu lista de deseos). Izquierda: no. Las dos enseñan a la app
  const onSwipe = (concert: Concert, liked: boolean) => {
    pinAfter(concert);
    if (liked && !isWished(concert.id)) toggleWish(concert);
    swipe(concert, liked);
  };
  const onMeeetIn = (concert: Concert) => {
    pinAfter(concert);
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!isGoing(concert.id)) toggleGoing(concert);
    swipe(concert, true);
  };

  let content: ReactNode;
  if (!profile.created) {
    content = (
      <ScrollView contentContainerStyle={styles.gate}>
        <CreateProfileCard intro="Descubrir te enseña conciertos de Barcelona hechos a tu medida, como cartas que deslizas. Para empezar, crea tu perfil." />
      </ScrollView>
    );
  } else if (!hasTastes && !picking) {
    content = (
      <Explainer
        icon="sparkles"
        title="Conciertos a tu medida"
        action="Elegir mis artistas"
        onAction={() => setPicking(true)}
      >
        <Point
          icon="musical-notes-outline"
          text={`Elige ${TASTE_PICKS} artistas que te encanten: así sabremos tu estilo y en qué idiomas te gusta la música.`}
        />
        <Point
          icon="albums-outline"
          text="Después te enseñaremos conciertos de Barcelona que encajan contigo."
        />
        <Point
          icon="trending-up-outline"
          text="Cuanto más uses la app (tus «¡Voy!», tu lista de deseos, las cartas que deslizas), mejor te conocerá."
        />
      </Explainer>
    );
  } else if (!hasTastes) {
    content = <TastePicker onDone={finishPicking} />;
  } else if (!deckIntroSeen) {
    content = (
      <Explainer
        icon="albums"
        title="Desliza para descubrir"
        action="Empezar a descubrir"
        onAction={finishDeckIntro}
      >
        <Point
          icon="arrow-forward-circle-outline"
          text="Irán apareciendo cartas de conciertos de Barcelona, con un trozo de la canción del grupo."
        />
        <Point
          icon="heart-outline"
          text="Desliza a la derecha si te gusta: irá a tu lista de deseos."
        />
        <Point icon="close-circle-outline" text="Desliza a la izquierda si no te interesa." />
        <Point
          icon="people-outline"
          text="¿Lo tienes claro? Desliza hacia arriba o dale a «¡Voy!» y apúntate para ir con gente."
        />
      </Explainer>
    );
  } else {
    content = (
      <ConcertDeck
        deck={deck}
        weights={weights}
        onSwipe={onSwipe}
        onMeeetIn={onMeeetIn}
        // La ficha se abre encima; con la flecha de volver se sigue en la misma carta
        onOpen={(c) => router.push({ pathname: '/concert/[id]', params: { id: c.id } })}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          // La pantalla ya termina sobre la barra de pestañas: basta con la zona segura
          { paddingTop: headerHeight, paddingBottom: insets.bottom },
        ]}
      >
        {content}
      </View>
      {/* Fija arriba, de cristal, como en las demás pestañas */}
      <ScreenHeader title="Descubrir" scrollY={scrollY} onHeight={setHeaderHeight} />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { flex: 1 },
    gate: { paddingBottom: 24 },
    explainer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
    explainerIcon: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accentSoft,
    },
    explainerIconColor: { color: theme.accent },
    explainerTitle: {
      color: COLORS.text,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.6,
      marginTop: 16,
      marginBottom: 12,
    },
    point: { flexDirection: 'row', gap: 12, marginTop: 14 },
    pointIcon: { color: theme.accent, marginTop: 1 },
    pointText: { flex: 1, color: COLORS.text, fontSize: 16, lineHeight: 22 },
    primary: {
      height: 54,
      borderRadius: 27,
      marginTop: 28,
      backgroundColor: COLORS.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  });
