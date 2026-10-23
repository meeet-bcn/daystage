import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { currentTabIcons, TabAvatarMaker, tabIconSources } from '@/components/tab-avatar';
import { useApp } from '@/data/app-context';
import { useTheme } from '@/hooks/use-theme';
import { COLORS } from '@/theme';

export default function AppTabs() {
  const theme = useTheme();
  const { unreadTotal, profile } = useApp();
  // Solo si las miniaturas son de la foto actual (si no, aún se están generando)
  const avatar = currentTabIcons(profile);

  return (
    <>
      {/* Antes que las pestañas, para que queden encima y lo tapen */}
      <TabAvatarMaker />
      {/* disableAutomaticContentInsets en cada pestaña: cada pantalla pone ya su margen
          superior (ScreenTitle, cabecera de Inicio); si no, iOS suma otra vez la zona segura */}
      <NativeTabs
        backgroundColor={COLORS.background}
        tintColor={theme.accent}
        iconColor={{ default: COLORS.muted, selected: theme.accent }}
        indicatorColor={theme.accentSoft}
        badgeBackgroundColor={COLORS.danger}
        labelStyle={{
          default: { color: COLORS.muted },
          selected: { color: theme.accent },
        }}
      >
        <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
          {/* Todos los iconos son PNG de scripts/generate-tab-icons.swift: VectorIcon se
              carga de forma asíncrona y, si el seleccionado llega antes, la barra falla */}
          <NativeTabs.Trigger.Icon
            src={{
              default: require('@/assets/images/tabs/home.png'),
              selected: require('@/assets/images/tabs/home-fill.png'),
            }}
            md="home"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="descubrir" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Label>Descubrir</NativeTabs.Trigger.Label>
          {/* Las mismas estrellas que la tarjeta "Recomendaciones para ti" */}
          <NativeTabs.Trigger.Icon
            src={{
              default: require('@/assets/images/tabs/discover.png'),
              selected: require('@/assets/images/tabs/discover-fill.png'),
            }}
            md="auto_awesome"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="meeet-in" disableAutomaticContentInsets>
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

        <NativeTabs.Trigger name="perfil" disableAutomaticContentInsets>
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
                default: require('@/assets/images/tabs/profile.png'),
                selected: require('@/assets/images/tabs/profile-fill.png'),
              }}
              md="account_circle"
            />
          )}
        </NativeTabs.Trigger>

        {/* Botón de búsqueda del sistema: en iOS 26 va aparte, en un círculo a la derecha */}
        <NativeTabs.Trigger name="buscar" disableAutomaticContentInsets role="search">
          <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md="search" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
