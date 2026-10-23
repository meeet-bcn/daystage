import { Ionicons } from '@expo/vector-icons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { currentTabIcons, TabAvatarMaker, tabIconSources } from '@/components/tab-avatar';
import { useApp } from '@/data/app-context';
import { COLORS } from '@/theme';

export default function AppTabs() {
  const { unreadTotal, profile } = useApp();
  // Solo si las miniaturas son de la foto actual (si no, aún se están generando)
  const avatar = currentTabIcons(profile);

  return (
    <>
      {/* Antes que las pestañas, para que queden encima y lo tapen */}
      <TabAvatarMaker />
      <NativeTabs
        backgroundColor={COLORS.background}
        tintColor={COLORS.accent}
        iconColor={{ default: COLORS.muted, selected: COLORS.accent }}
        indicatorColor={COLORS.accentSoft}
        badgeBackgroundColor={COLORS.danger}
        labelStyle={{
          default: { color: COLORS.muted },
          selected: { color: COLORS.accent },
        }}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
          {/* Casa sin puerta y el imagotipo de meeet in: scripts/generate-tab-icons.swift */}
          <NativeTabs.Trigger.Icon
            src={{
              default: require('@/assets/images/tabs/home.png'),
              selected: require('@/assets/images/tabs/home-fill.png'),
            }}
            md="home"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="descubrir">
          <NativeTabs.Trigger.Label>Descubrir</NativeTabs.Trigger.Label>
          {/* Las mismas estrellas que la tarjeta "Recomendaciones para ti" */}
          <NativeTabs.Trigger.Icon
            src={{
              default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="sparkles-outline" />,
              selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="sparkles" />,
            }}
            md="auto_awesome"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="meeet-in">
          <NativeTabs.Trigger.Label>Meeet in</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={{
              default: require('@/assets/images/tabs/meeet-in.png'),
              selected: require('@/assets/images/tabs/meeet-in-fill.png'),
            }}
            md="confirmation_number"
          />
          {/* Solo si hay algo sin leer: en iOS, `hidden` deja un "0" y un badge vacío, un punto */}
          {unreadTotal > 0 && (
            <NativeTabs.Trigger.Badge>
              {unreadTotal > 9 ? '9+' : String(unreadTotal)}
            </NativeTabs.Trigger.Badge>
          )}
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="perfil">
          <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
          {/* Con foto, su miniatura circular en sus colores; si no, un icono genérico.
              Siempre imagen, no SF Symbol, como las demás: si no, su etiqueta queda más baja */}
          {avatar ? (
            <NativeTabs.Trigger.Icon
              src={tabIconSources(avatar)}
              renderingMode="original"
              md="account_circle"
            />
          ) : (
            <NativeTabs.Trigger.Icon
              src={{
                default: (
                  <NativeTabs.Trigger.VectorIcon family={Ionicons} name="person-circle-outline" />
                ),
                selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="person-circle" />,
              }}
              md="account_circle"
            />
          )}
        </NativeTabs.Trigger>

        {/* Botón de búsqueda del sistema: en iOS 26 va aparte, en un círculo a la derecha */}
        <NativeTabs.Trigger name="buscar" role="search">
          <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md="search" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
