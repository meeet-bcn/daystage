import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, Text } from 'react-native';

import { MaxContentWidth } from '@/constants/theme';
import { useApp } from '@/data/app-context';
import { COLORS } from '@/theme';

export default function AppTabs() {
  const { unreadTotal } = useApp();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Inicio</TabButton>
          </TabTrigger>
          <TabTrigger name="descubrir" href="/descubrir" asChild>
            <TabButton>Descubrir</TabButton>
          </TabTrigger>
          <TabTrigger name="meeet-in" href="/meeet-in" asChild>
            <TabButton badge={unreadTotal > 0}>Meeet in</TabButton>
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
  ...props
}: TabTriggerSlotProps & { badge?: boolean }) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonActive]}>
        <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>{children}</Text>
        {badge && <View style={styles.badge} />}
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
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

const styles = StyleSheet.create({
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
    color: COLORS.accent,
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
  tabButtonActive: { backgroundColor: COLORS.accentSoft },
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
  tabTextActive: { color: COLORS.accent },
});
