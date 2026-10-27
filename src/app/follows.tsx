import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersonRow } from '@/components/person-row';
import { SearchBar } from '@/components/search-bar';
import { useApp } from '@/data/app-context';
import { useSession } from '@/data/session-context';
import { nickQuery, type PublicProfile } from '@/data/social';
import { useSocial } from '@/data/social-context';
import { searchProfiles } from '@/data/social-service';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

type Tab = 'followers' | 'following';
const TABS: { key: Tab; label: string }[] = [
  { key: 'followers', label: 'Seguidores' },
  { key: 'following', label: 'Seguidos' },
];

// Sin cuenta (o sin nadie aún), las listas están vacías y se dice por qué
const EMPTY: Record<Tab, { icon: 'people-outline' | 'person-add-outline'; title: string; text: string }> =
  {
    followers: {
      icon: 'people-outline',
      title: 'Aún no te sigue nadie',
      text: 'Aquí verás a la gente que te sigue. Ve a conciertos y dale a «Meeet In!»: así te encontrarán.',
    },
    following: {
      icon: 'person-add-outline',
      title: 'Aún no sigues a nadie',
      text: 'Busca a tus amigos por su nick o síguelos desde la sala de un concierto. Si os seguís los dos, podréis ver qué días tenéis libres.',
    },
  };

/** Seguidores y seguidos de tu perfil, como en Instagram (se abre desde sus números en Perfil). */
export default function FollowsScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const { profile } = useApp();
  const { userId, enabled } = useSession();
  const { following, followers } = useSocial();
  const [tab, setTab] = useState<Tab>(params.tab === 'following' ? 'following' : 'followers');
  const counts: Record<Tab, number> = userId
    ? { followers: followers.length, following: following.length }
    : { followers: profile.followers, following: profile.following };
  const empty = EMPTY[tab];

  // Buscar gente por nick (con una pequeña espera mientras escribes)
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<PublicProfile[]>([]);
  const q = nickQuery(query);
  useEffect(() => {
    if (!userId || q.length < 2) return;
    const timer = setTimeout(() => {
      searchProfiles(q, userId)
        .then(setFound)
        .catch((e) => console.warn('[social] Buscar:', e));
    }, 300);
    return () => clearTimeout(timer);
  }, [q, userId]);
  const searching = q.length >= 2;
  const list = searching ? found : tab === 'followers' ? followers : following;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={26} color={theme.accent} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {profile.nick || 'Perfil'}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {counts[t.key]} {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {userId ? (
        <FlatList
          data={list}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
          ListHeaderComponent={
            <View style={styles.search}>
              <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar por nick" />
            </View>
          }
          renderItem={({ item }) => <PersonRow person={item} />}
          ListEmptyComponent={
            searching ? (
              <Text style={styles.noResults}>Nadie con ese nick.</Text>
            ) : (
              <View style={styles.emptyInList}>
                <Ionicons name={empty.icon} size={36} color={COLORS.lavender} />
                <Text style={styles.emptyTitle}>{empty.title}</Text>
                <Text style={styles.emptyText}>{empty.text}</Text>
              </View>
            )
          }
        />
      ) : (
        <View style={[styles.empty, { paddingBottom: insets.bottom + 80 }]}>
          <Ionicons name={empty.icon} size={36} color={COLORS.lavender} />
          <Text style={styles.emptyTitle}>{empty.title}</Text>
          <Text style={styles.emptyText}>
            {enabled ? 'Para seguir a gente y ver a tus seguidores, entra con tu cuenta.' : empty.text}
          </Text>
          {enabled && (
            <Pressable style={styles.signIn} onPress={() => router.push('/sign-in')}>
              <Text style={styles.signInText}>Crear cuenta o entrar</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    topTitle: { flex: 1, textAlign: 'center', color: COLORS.text, fontSize: 17, fontWeight: '700' },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: theme.accent },
    tabText: { color: COLORS.muted, fontSize: 15, fontWeight: '600' },
    tabTextActive: { color: theme.accent, fontWeight: '700' },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 40,
    },
    emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 6 },
    emptyText: { color: COLORS.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
    emptyInList: { alignItems: 'center', gap: 8, paddingTop: 48, paddingHorizontal: 20 },
    search: { paddingVertical: 12 },
    noResults: { color: COLORS.muted, fontSize: 15, textAlign: 'center', marginTop: 24 },
    signIn: {
      marginTop: 12,
      height: 46,
      paddingHorizontal: 24,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    signInText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  });
