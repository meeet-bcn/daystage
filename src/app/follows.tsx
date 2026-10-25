import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/data/app-context';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

type Tab = 'followers' | 'following';
const TABS: { key: Tab; label: string }[] = [
  { key: 'followers', label: 'Seguidores' },
  { key: 'following', label: 'Seguidos' },
];

// Aún no hay cuentas de otras personas: las listas están vacías y se dice por qué
const EMPTY: Record<Tab, { icon: 'people-outline' | 'person-add-outline'; title: string; text: string }> =
  {
    followers: {
      icon: 'people-outline',
      title: 'Aún no te sigue nadie',
      text: 'Cuando haya cuentas, aquí verás a la gente que te sigue. Ve a conciertos y dale a «Meeet In!»: así te encontrarán.',
    },
    following: {
      icon: 'person-add-outline',
      title: 'Aún no sigues a nadie',
      text: 'Cuando haya cuentas, podrás seguir a la gente que conozcas en las salas de los conciertos y aparecerá aquí.',
    },
  };

/** Seguidores y seguidos de tu perfil, como en Instagram (se abre desde sus números en Perfil). */
export default function FollowsScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const { profile } = useApp();
  const [tab, setTab] = useState<Tab>(params.tab === 'following' ? 'following' : 'followers');
  const counts: Record<Tab, number> = { followers: profile.followers, following: profile.following };
  const empty = EMPTY[tab];

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

      {/* Cuando haya cuentas, aquí irá la lista de personas */}
      <View style={[styles.empty, { paddingBottom: insets.bottom + 80 }]}>
        <Ionicons name={empty.icon} size={36} color={COLORS.lavender} />
        <Text style={styles.emptyTitle}>{empty.title}</Text>
        <Text style={styles.emptyText}>{empty.text}</Text>
      </View>
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
  });
