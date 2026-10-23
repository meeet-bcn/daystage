// Foto de perfil: se elige con el selector del sistema (recorte cuadrado) y,
// al guardar el perfil, se copia a los documentos de la app, porque el archivo
// que devuelve el selector está en la caché y el sistema puede borrarlo.

import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import type { TabIcons } from '@/data/profile';

/** Abre la galería. Devuelve la URI temporal de la foto recortada, o null si se cancela. */
export async function pickProfilePhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true, // en iOS el recorte siempre es cuadrado
    aspect: [1, 1], // Android
    shape: 'oval', // Android: guía de recorte circular
    quality: 0.8,
  });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

const isSaved = (uri: string) => uri.startsWith(Paths.document.uri);

/**
 * Deja `uri` como foto definitiva y borra la anterior. Cada foto lleva un
 * nombre nuevo para que las imágenes en caché no muestren la vieja.
 */
export function saveProfilePhoto(uri: string, previous: string): string {
  if (uri === previous) return uri;

  let saved = uri;
  if (uri && !isSaved(uri)) {
    const extension = uri.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
    const destination = new File(Paths.document, `avatar-${Date.now()}.${extension}`);
    new File(uri).copySync(destination);
    saved = destination.uri;
  }

  if (previous && isSaved(previous)) {
    const old = new File(previous);
    if (old.exists) old.delete();
  }
  return saved;
}

/** Copia a documentos un PNG temporal (las miniaturas de la pestaña) con nombre nuevo. */
export function keepTabIcon(tmpUri: string, name: 'normal' | 'selected'): string {
  const destination = new File(Paths.document, `tab-${name}-${Date.now()}.png`);
  new File(tmpUri).moveSync(destination);
  return destination.uri;
}

/** Borra las miniaturas de la pestaña que ya no se usan. */
export function deleteTabIcons(icons: TabIcons | null) {
  for (const uri of icons ? [icons.normal, icons.selected] : []) {
    const file = new File(uri);
    if (isSaved(uri) && file.exists) file.delete();
  }
}
