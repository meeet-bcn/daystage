import { Image, ImageStyle } from 'expo-image';
import { StyleProp } from 'react-native';

import { MusicPlaceholder } from '@/components/music-placeholder';
import type { Concert } from '@/data/concerts';
import { useArtistArtwork } from '@/hooks/use-artist-artwork';

type Props = {
  concert: Concert;
  /** Qué foto del concierto se prefiere (la apaisada `image` o la grande `hero`). */
  prefer?: 'image' | 'hero';
  style: StyleProp<ImageStyle>;
  /** Tamaño de las notas de la imagen genérica. */
  iconSize?: number;
};

/**
 * Imagen de un concierto: su foto; si no tiene, una del artista (Apple Music);
 * y si tampoco hay, la imagen genérica de música.
 */
export function ConcertImage({ concert, prefer = 'image', style, iconSize }: Props) {
  const own = prefer === 'hero' ? concert.hero || concert.image : concert.image || concert.hero;
  const artwork = useArtistArtwork(concert.artist, !own);
  const uri = own || artwork;

  return uri ? (
    <Image source={{ uri }} style={style} transition={200} />
  ) : (
    <MusicPlaceholder style={style} iconSize={iconSize} />
  );
}
