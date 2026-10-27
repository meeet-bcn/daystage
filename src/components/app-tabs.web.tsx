import type { Ref } from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { HostInstance, Pressable, View, StyleSheet, Text } from 'react-native';

import { MaxContentWidth } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

export default function AppTabs() {
  const { unreadTotal } = useApp();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Calendario</TabButton>
          </TabTrigger>
          <TabTrigger name="eventos" href="/eventos" asChild>
            <TabButton>Eventos</TabButton>
          </TabTrigger>
          <TabTrigger name="descubrir" href="/descubrir" asChild>
            <TabButton>Descubrir</TabButton>
          </TabTrigger>
          <TabTrigger name="meeet-in" href="/meeet-in" asChild>
            <TabButton badge={unreadTotal > 0}>Planes</TabButton>
          </TabTrigger>
          <TabTrigger name="perfil" href="/perfil" asChild>
            <TabButton>Perfil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  badge = false,
  ref,
  ...props
}: TabTriggerSlotProps & { badge?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return (
    // expo-router tipa la ref con el componente View, no con su instancia (API estricta de RN 0.88)
    <Pressable {...props} ref={ref as unknown as Ref<HostInstance>} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonActive]}>
        <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>{children}</Text>
        {badge && <View style={styles.badge} />}
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <Text style={styles.brandText}>
          meeet<Text style={{ color: COLORS.peach }}>.</Text>
        </Text>

        {props.children}
      </View>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    tabListContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      padding: 16,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    innerContainer: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 32,
      flexDirection: 'row',
      alignItems: 'center',
      flexGrow: 1,
      gap: 8,
      maxWidth: MaxContentWidth,
      backgroundColor: COLORS.surface,
    },
    brandText: {
      marginRight: 'auto',
      color: theme.accent,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    pressed: {
      opacity: 0.7,
    },
    tabButtonView: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 16,
    },
    tabButtonActive: { backgroundColor: theme.accentSoft },
    badge: {
      position: 'absolute',
      top: 2,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: COLORS.danger,
    },
    tabText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: theme.accent },
  });
