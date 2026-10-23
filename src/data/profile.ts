/** Perfil del usuario. Aún no hay cuentas ni backend: vive en el móvil y empieza vacío. */
export type Profile = {
  nick: string;
  name: string;
  bio: string;
  /** URI de la foto de perfil (en los documentos de la app), o '' si no hay. */
  photo: string;
  followers: number;
  following: number;
};

export const EMPTY_PROFILE: Profile = {
  nick: '',
  name: '',
  bio: '',
  photo: '',
  followers: 0,
  following: 0,
};

export const NICK_MAX = 30;
export const NAME_MAX = 40;
export const BIO_MAX = 150;

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
