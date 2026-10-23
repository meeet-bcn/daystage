import type { ProfileSong } from '@/data/songs';

/** Perfil del usuario. Aún no hay cuentas ni backend: vive en el móvil y empieza vacío. */
export type Profile = {
  nick: string;
  name: string;
  /** Pronombres libres ("ella", "él/elle"…). Se muestran en gris junto al nombre. */
  pronouns: string;
  bio: string;
  /** Usuario en cada red, sin "@" ni URL. Vacío si no la tiene. */
  socials: Socials;
  /** Canción del perfil (fragmento de Apple Music), o null. */
  song: ProfileSong | null;
  /** URI de la foto de perfil (en los documentos de la app), o '' si no hay. */
  photo: string;
  /** Miniaturas circulares de la foto para la pestaña Perfil (ver tab-avatar.tsx), o null. */
  tabIcons: TabIcons | null;
  followers: number;
  following: number;
};

export type SocialNetwork = 'instagram' | 'tiktok' | 'x';
export type Socials = Record<SocialNetwork, string>;

/** PNG de la pestaña: normal y seleccionada, con la foto y el tamaño (pt) con que se hicieron. */
export type TabIcons = { photo: string; size: number; normal: string; selected: string };

export const EMPTY_PROFILE: Profile = {
  nick: '',
  name: '',
  pronouns: '',
  bio: '',
  socials: { instagram: '', tiktok: '', x: '' },
  song: null,
  photo: '',
  tabIcons: null,
  followers: 0,
  following: 0,
};

export const NICK_MAX = 30;
export const NAME_MAX = 40;
export const BIO_MAX = 150;
export const PRONOUNS_MAX = 20;

/** Datos de cada red: nombre, icono (Ionicons), perfil público y reglas de su usuario. */
export const SOCIAL_NETWORKS: Record<
  SocialNetwork,
  {
    label: string;
    icon: 'logo-instagram' | 'logo-tiktok' | 'logo-x';
    max: number;
    chars: RegExp;
    url: (handle: string) => string;
  }
> = {
  instagram: {
    label: 'Instagram',
    icon: 'logo-instagram',
    max: 30,
    chars: /^[a-z0-9._]+$/,
    url: (h) => `https://www.instagram.com/${h}`,
  },
  tiktok: {
    label: 'TikTok',
    icon: 'logo-tiktok',
    max: 24,
    chars: /^[a-z0-9._]+$/,
    url: (h) => `https://www.tiktok.com/@${h}`,
  },
  x: {
    label: 'X',
    icon: 'logo-x',
    max: 15,
    chars: /^[a-z0-9_]+$/,
    url: (h) => `https://x.com/${h}`,
  },
};

export const SOCIAL_ORDER: SocialNetwork[] = ['instagram', 'tiktok', 'x'];

/**
 * Lo que pega el usuario, como se guarda: acepta "@usuario" o el enlace de su
 * perfil (instagram.com/usuario, tiktok.com/@usuario, x.com/usuario…).
 */
export function normalizeHandle(input: string) {
  let text = input.trim();
  const fromUrl = text.match(
    /^(?:https?:\/\/)?(?:www\.|m\.|mobile\.)?(?:instagram\.com|tiktok\.com|x\.com|twitter\.com)\/@?([^/?#\s]+)/i
  );
  if (fromUrl) text = fromUrl[1];
  // En las tres redes el usuario no distingue mayúsculas
  return text.replace(/^@+/, '').replace(/\s+/g, '').toLowerCase();
}

/** Motivo por el que el usuario no vale en esa red, o null. Vacío es válido. */
export function handleError(network: SocialNetwork, handle: string): string | null {
  const { max, chars } = SOCIAL_NETWORKS[network];
  if (handle === '') return null;
  if (handle.length > max) return `Máximo ${max} caracteres.`;
  if (!chars.test(handle)) {
    return network === 'x'
      ? 'Solo letras sin acentos, números y "_".'
      : 'Solo letras sin acentos, números, "." y "_".';
  }
  return null;
}

/** Lo que escribe el usuario, como se guarda: sin "@", sin espacios y en minúsculas. */
export function normalizeNick(input: string) {
  return input.trim().replace(/^@+/, '').replace(/\s+/g, '').toLowerCase();
}

/**
 * Reglas del nick, como en Instagram: letras, números, "." y "_", de 3 a 30
 * caracteres, sin empezar ni acabar en punto ni dos puntos seguidos.
 * Devuelve el motivo del error, o null si es válido. Vacío es válido (opcional).
 */
export function nickError(nick: string): string | null {
  if (nick === '') return null;
  if (nick.length < 3) return 'Mínimo 3 caracteres.';
  if (nick.length > NICK_MAX) return `Máximo ${NICK_MAX} caracteres.`;
  if (!/^[a-z0-9._]+$/.test(nick)) return 'Solo letras sin acentos, números, "." y "_".';
  if (nick.startsWith('.') || nick.endsWith('.')) return 'No puede empezar ni acabar en punto.';
  if (nick.includes('..')) return 'No puede tener dos puntos seguidos.';
  return null;
}
