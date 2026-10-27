import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConcertImage } from '@/components/concert-image';
import { CreateProfileCard } from '@/components/create-profile-card';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenSubtitle } from '@/components/screen-title';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { splitPlans } from '@/data/plans';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

export default function MeeetInScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { myConcerts, plans, unreadCount, goingCount, profile } = useApp();
  // Los chats de conciertos pasados no se borran: van abajo, plegables
  const past = profile.created ? splitPlans(plans).past : [];
  const [showPast, setShowPast] = useState(false);

  const openConcert = (id: string) => router.push({ pathname: '/concert/[id]', params: { id } });
  // El chat de cada concierto solo se abre desde aquí
  // Sin perfil, primero se crea (los chats son una de sus ventajas)
  const openChat = (id: string) =>
    profile.created
      ? router.push({ pathname: '/chat/[id]', params: { id } })
      : router.push('/onboarding');

  const togglePast = () => setShowPast((v) => !v);

  const renderRow = (item: Concert, isPast = false) => {
    const unread = unreadCount(item.id);
    const count = goingCount(item);
    return (
      <Pressable style={styles.row} onPress={() => openConcert(item.id)}>
        <ConcertImage
          concert={item}
          style={[styles.thumb, isPast && styles.pastThumb]}
          iconSize={26}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.date, isPast && styles.pastDate]}>{item.date}</Text>
          <Text style={styles.artist} numberOfLines={1}>
            {item.artist}
          </Text>
          <Text style={styles.venue} numberOfLines={1}>
            {item.venue} · {count} {isPast ? (count === 1 ? 'fue' : 'fueron') : count === 1 ? 'va' : 'van'}
          </Text>
        </View>
        <Pressable
          style={styles.chat}
          hitSlop={8}
          accessibilityLabel={unread > 0 ? `Chat, ${unread} sin leer` : 'Chat'}
          onPress={() => openChat(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={22} color={theme.accent} />
          {unread > 0 && (
            <View style={styles.unread}>
              <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    );
  };

  const scrollY = useAnimatedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);

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
        data={myConcerts}
        keyExtractor={(item: Concert) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + BottomTabInset + 32,
        }}
        ListHeaderComponent={
          profile.created ? (
            <ScreenSubtitle>Tus planes y sus chats</ScreenSubtitle>
          ) : (
            // Sin perfil: qué es Meeet in y la invitación a crearlo (los chats lo necesitan)
            <View style={styles.gate}>
              <CreateProfileCard intro="Planes reúne los conciertos a los que vas y la sala de chat de cada uno, para conocer a la gente que también va, quedar y compartir fotos o el setlist. Para entrar en las salas, crea tu perfil." />
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="ticket-outline" size={32} color={COLORS.lavender} />
            <Text style={styles.emptyTitle}>
              {past.length > 0 ? 'No tienes planes próximos' : 'Aún no tienes planes'}
            </Text>
            <Text style={styles.emptyText}>
              Dale a «¡Voy!» en un concierto y aparecerá aquí, con su chat.
            </Text>
            <Pressable style={styles.emptyButton} onPress={() => router.navigate('/eventos')}>
              <Text style={styles.emptyButtonText}>Ver conciertos</Text>
            </Pressable>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }: { item: Concert }) => renderRow(item)}
        ListFooterComponent={
          past.length > 0 ? (
            <View style={styles.past}>
              <Pressable
                style={styles.pastHeader}
                onPress={togglePast}
                accessibilityRole="button"
                accessibilityState={{ expanded: showPast }}
                accessibilityLabel={`Conciertos pasados, ${past.length}`}
              >
                <Text style={styles.pastTitle}>Conciertos pasados</Text>
                <Text style={styles.pastCount}>{past.length}</Text>
                <Ionicons
                  name={showPast ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.muted}
                />
              </Pressable>
              {showPast &&
                past.map((c, i) => (
                  <View key={c.id}>
                    {i > 0 && <View style={styles.separator} />}
                    {renderRow(c, true)}
                  </View>
                ))}
            </View>
          ) : undefined
        }
      />
      {/* Fija arriba, de cristal: la lista pasa por debajo */}
      <ScreenHeader title="Planes" scrollY={scrollY} onHeight={setHeaderHeight} />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    gate: { marginBottom: 20 },
    container: { flex: 1, backgroundColor: COLORS.background },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
    thumb: { width: 72, height: 72, borderRadius: 16, backgroundColor: COLORS.surface },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: COLORS.line,
      marginVertical: 14,
      marginLeft: 106,
    },
    date: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    artist: {
      color: COLORS.text,
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
      marginTop: 2,
    },
    venue: { color: COLORS.muted, fontSize: 14, marginTop: 2 },
    chat: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unread: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: COLORS.danger,
      borderWidth: 2,
      borderColor: COLORS.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
    empty: {
      marginHorizontal: 20,
      backgroundColor: COLORS.surface,
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      gap: 6,
    },
    emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
    emptyText: { color: COLORS.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
    emptyButton: {
      marginTop: 14,
      height: 46,
      paddingHorizontal: 24,
      borderRadius: 23,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    past: { marginTop: 28 },
    pastHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 20,
      marginBottom: 14,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COLORS.line,
    },
    pastTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
    pastCount: { flex: 1, color: COLORS.muted, fontSize: 15, fontWeight: '600' },
    pastThumb: { opacity: 0.75 },
    pastDate: { color: COLORS.muted },
  });
