import type { ProfileSong } from '@/data/songs';
import type { ProfileBackground } from '@/theme';

/** Perfil del usuario. Aún no hay cuentas ni backend: vive en el móvil y empieza vacío. */
export type Profile = {
  nick: string;
  name: string;
  /** Pronombres elegidos de PRONOUN_OPTIONS, unidos con " · " ("ella · she/her"). En gris junto al nombre. */
  pronouns: string;
  bio: string;
  /** Usuario en cada red, sin "@" ni URL. Vacío si no la tiene. */
  socials: Socials;
  /** Fondo de tu perfil (PROFILE_BACKGROUNDS): lo ve quien entre en él. */
  background: ProfileBackground;
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

/** PNG de la pestaña: normal y seleccionada, con la foto, el tamaño (pt) y el color del aro con que se hicieron. */
export type TabIcons = {
  photo: string;
  size: number;
  /** Color del aro de la seleccionada: el acento del tema cuando se generó. */
  accent?: string;
  normal: string;
  selected: string;
};

export const EMPTY_PROFILE: Profile = {
  nick: '',
  name: '',
  pronouns: '',
  bio: '',
  socials: { instagram: '', tiktok: '', x: '' },
  song: null,
  background: 'none',
  photo: '',
  tabIcons: null,
  followers: 0,
  following: 0,
};

export const NICK_MAX = 30;
export const NAME_MAX = 40;
export const BIO_MAX = 150;
/**
 * Pronombres que se pueden elegir (no se escriben). En español y, como la app
 * la usan turistas, también en inglés. Hasta PRONOUNS_PICK_MAX a la vez.
 */
export const PRONOUN_OPTIONS = ['él', 'ella', 'elle', 'he/him', 'she/her', 'they/them'];
export const PRONOUNS_PICK_MAX = 3;
const PRONOUNS_SEPARATOR = ' · ';

/** Los pronombres guardados, como lista (solo los que siguen en PRONOUN_OPTIONS). */
export function parsePronouns(saved: string) {
  return saved.split(PRONOUNS_SEPARATOR).filter((p) => PRONOUN_OPTIONS.includes(p));
}

export function formatPronouns(picked: string[]) {
  return picked.join(PRONOUNS_SEPARATOR);
}

/**
 * Tocar un pronombre: lo quita si estaba; si no, lo añade al final, salvo que
 * ya haya PRONOUNS_PICK_MAX elegidos.
 */
export function togglePronoun(picked: string[], option: string) {
  if (picked.includes(option)) return picked.filter((p) => p !== option);
  return picked.length < PRONOUNS_PICK_MAX ? [...picked, option] : picked;
}

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
