import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenTitle } from '@/components/screen-title';
import { BottomTabInset } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { Concert } from '@/data/concerts';
import { COLORS } from '@/theme';

export default function MeeetInScreen() {
  const insets = useSafeAreaInsets();
  const { myConcerts, unreadCount, goingCount } = useApp();

  const openConcert = (id: string, tab?: 'chat') =>
    router.push({ pathname: '/concert/[id]', params: tab ? { id, tab } : { id } });

  return (
    <FlatList
      // El margen superior lo pone ScreenTitle; sin esto iOS lo suma otra vez
      contentInsetAdjustmentBehavior="never"
      style={styles.container}
      data={myConcerts}
      keyExtractor={(item: Concert) => item.id}
      contentContainerStyle={{ paddingBottom: insets.bottom + BottomTabInset + 32 }}
      ListHeaderComponent={<ScreenTitle title="Meeet in" subtitle="Tus planes y sus chats" />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="ticket-outline" size={32} color={COLORS.lavender} />
          <Text style={styles.emptyTitle}>Aún no tienes planes</Text>
          <Text style={styles.emptyText}>
            Dale a «Voy» en un concierto y aparecerá aquí, con su chat.
          </Text>
          <Pressable style={styles.emptyButton} onPress={() => router.navigate('/')}>
            <Text style={styles.emptyButtonText}>Ver conciertos</Text>
          </Pressable>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }: { item: Concert }) => {
        const unread = unreadCount(item.id);
        const count = goingCount(item);
        return (
          <Pressable style={styles.row} onPress={() => openConcert(item.id)}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.thumb} />
            ) : (
              <View style={styles.thumb} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.artist} numberOfLines={1}>
                {item.artist}
              </Text>
              <Text style={styles.venue} numberOfLines={1}>
                {item.venue} · {count} {count === 1 ? 'va' : 'van'}
              </Text>
            </View>
            <Pressable
              style={styles.chat}
              hitSlop={8}
              accessibilityLabel={unread > 0 ? `Chat, ${unread} sin leer` : 'Chat'}
              onPress={() => openConcert(item.id, 'chat')}
            >
              <Ionicons name="chatbubble-outline" size={22} color={COLORS.accent} />
              {unread > 0 && (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
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
    color: COLORS.accent,
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
    backgroundColor: COLORS.accentSoft,
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
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
