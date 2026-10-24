// Guardar en la galería del móvil una foto o un vídeo (de la sala o del
// concierto). Las remotas se bajan antes a la caché: la galería solo acepta
// archivos locales.

import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';

/** Pide permiso (solo de escritura) y guarda. Devuelve false si no hay permiso. */
export async function saveToGallery(uri: string, kind: 'photo' | 'video'): Promise<boolean> {
  const { granted } = await requestPermissionsAsync(true, [kind]);
  if (!granted) return false;

  let local = uri;
  if (/^https?:\/\//.test(uri)) {
    const extension = kind === 'video' ? 'mp4' : 'jpg';
    const destination = new File(Paths.cache, `meeet-${Date.now()}.${extension}`);
    local = (await File.downloadFileAsync(uri, destination)).uri;
  }
  await Asset.create(local);
  return true;
}
