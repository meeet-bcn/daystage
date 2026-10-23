import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useApp } from '@/data/app-context';
import { COLORS } from '@/theme';

export default function AppTabs() {
  const { unreadTotal, profile } = useApp();

  return (
    <NativeTabs
      backgroundColor={COLORS.background}
      tintColor={COLORS.accent}
      iconColor={{ default: COLORS.muted, selected: COLORS.accent }}
      indicatorColor={COLORS.accentSoft}
      badgeBackgroundColor={COLORS.danger}
      labelStyle={{ default: { color: COLORS.muted }, selected: { color: COLORS.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="descubrir">
        <NativeTabs.Trigger.Label>Descubrir</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="meeet-in">
        <NativeTabs.Trigger.Label>meeet in</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'ticket', selected: 'ticket.fill' }}
          md="confirmation_number"
        />
        {/* Solo si hay algo sin leer: en iOS, `hidden` deja un "0" y un badge vacío, un punto */}
        {unreadTotal > 0 && (
          <NativeTabs.Trigger.Badge>{unreadTotal > 9 ? '9+' : String(unreadTotal)}</NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        {/* La barra nativa no recorta en círculo: la foto debe guardarse ya recortada */}
        {profile.photo ? (
          <NativeTabs.Trigger.Icon src={{ uri: profile.photo }} renderingMode="original" />
        ) : (
          <NativeTabs.Trigger.Icon
            sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
            md="account_circle"
          />
        )}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
