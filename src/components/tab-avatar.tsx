// Foto de perfil en la pestaña Perfil. La barra nativa no recorta imágenes en
// círculo, así que se pinta el círculo aquí, oculto bajo las pestañas, y se
// captura como PNG transparente (react-native-view-shot): uno normal y otro
// con el aro de "seleccionada". Se regenera solo cuando cambia la foto.

import { useRef } from 'react';
import {
  HostInstance,
  Image,
  ImageSourcePropType,
  PixelRatio,
  StyleSheet,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { useApp } from '@/data/app-context';
import { deleteTabIcons, keepTabIcon } from '@/data/profile-photo';
import { Profile, TabIcons } from '@/data/profile';
import { themeFor } from '@/theme';

// Ajustes del icono
const ICON_SIZE = 26; // lado del PNG en pt, como los demás iconos de la barra (tabs/*.png)
const PHOTO_SIZE = 24; // foto sin seleccionar
const RING_WIDTH = 1.8; // aro violeta de la pestaña seleccionada
const RING_GAP = 1.2; // aire transparente entre el aro y la foto

/**
 * Las miniaturas del perfil si son de su foto actual, del tamaño actual y con
 * el aro del color de su tema (cambia con el fondo del perfil); si no, null.
 */
export function currentTabIcons({ photo, tabIcons, background }: Profile) {
  return photo &&
    tabIcons?.photo === photo &&
    tabIcons.size === ICON_SIZE &&
    tabIcons.accent === themeFor(background).accent
    ? tabIcons
    : null;
}

/** Fuentes de imagen para `NativeTabs.Trigger.Icon`, a escala de pantalla. */
export function tabIconSources(icons: TabIcons) {
  const source = (uri: string): ImageSourcePropType => ({
    uri,
    width: ICON_SIZE,
    height: ICON_SIZE,
    scale: PixelRatio.get(),
  });
  return { default: source(icons.normal), selected: source(icons.selected) };
}

/** Genera las miniaturas si la foto del perfil no tiene las suyas. No se ve. */
export function TabAvatarMaker() {
  const { profile, updateProfile } = useApp();
  const normal = useRef<HostInstance>(null);
  const selected = useRef<HostInstance>(null);
  const loaded = useRef(new Set<string>());
  const busy = useRef(false);

  const { photo, tabIcons } = profile;
  // El aro de la pestaña seleccionada, con el acento del fondo del perfil
  const accent = themeFor(profile.background).accent;
  if (!photo || currentTabIcons(profile)) return null;

  const onLoad = async (key: 'normal' | 'selected') => {
    loaded.current.add(`${photo}|${key}`);
    const ready = ['normal', 'selected'].every((k) => loaded.current.has(`${photo}|${k}`));
    if (!ready || busy.current) return;

    busy.current = true;
    try {
      const options = { format: 'png', result: 'tmpfile' } as const;
      const icons: TabIcons = {
        photo,
        size: ICON_SIZE,
        accent,
        normal: keepTabIcon(await captureRef(normal, options), 'normal'),
        selected: keepTabIcon(await captureRef(selected, options), 'selected'),
      };
      deleteTabIcons(tabIcons);
      updateProfile({ tabIcons: icons });
    } catch (e) {
      // Sin miniatura la pestaña sigue con el icono del sistema
      console.warn('[tab-avatar] No se pudo generar el icono:', e);
    } finally {
      busy.current = false;
    }
  };

  return (
    <View pointerEvents="none" style={styles.hidden} accessibilityElementsHidden>
      <View ref={normal} collapsable={false} style={styles.canvas}>
        <Image source={{ uri: photo }} style={styles.photo} onLoad={() => onLoad('normal')} />
      </View>
      <View ref={selected} collapsable={false} style={styles.canvas}>
        <View style={[styles.ring, { borderColor: accent }]}>
          <Image
            source={{ uri: photo }}
            style={styles.photoSelected}
            onLoad={() => onLoad('selected')}
          />
        </View>
      </View>
    </View>
  );
}

const SELECTED_PHOTO = ICON_SIZE - 2 * (RING_WIDTH + RING_GAP);

const styles = StyleSheet.create({
  // En pantalla pero tapado por las pestañas: fuera de ella iOS podría no pintarlo
  hidden: { position: 'absolute', top: 0, left: 0, flexDirection: 'row' },
  canvas: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  photo: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2 },
  ring: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    borderWidth: RING_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSelected: {
    width: SELECTED_PHOTO,
    height: SELECTED_PHOTO,
    borderRadius: SELECTED_PHOTO / 2,
  },
});
