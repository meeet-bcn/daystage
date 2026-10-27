// Paleta de la hoja de marca de MEEET (imagotipo: lavanda + melocotón, cruce en violeta)
export const COLORS = {
  background: '#FFFFFF',
  /** Fondo lavanda casi blanco de la marca (tarjetas de marca, icono "Claro"). */
  mist: '#FAF8FF',
  surface: '#F5F5F7',
  /** Tinta de la marca: el "meeet" del logotipo, textos principales. */
  text: '#2A2540',
  muted: '#6E6E73',
  line: '#E5E5EA',
  /** Violeta: el cruce de los círculos y el punto del logotipo. */
  accent: '#8F78F5',
  accentSoft: '#EFEBFF',
  lavender: '#C7B8FF',
  peach: '#FFCFC2',
  /** Escala del salmón para las "eee" del logotipo, de clara a oscura (peach → peachMid → peachDeep). */
  peachMid: '#FFAE98',
  peachDeep: '#F98B6F',
  danger: '#FF3B30',
  white: '#FFFFFF',
  /** Solo para el visor de fotos a pantalla completa. */
  black: '#000000',
};

/**
 * Fondos del perfil (Editar perfil): pasteles en parejas armónicas o
 * complementarias, con un degradado suave y no un color plano. Los ve
 * cualquiera que entre en tu perfil. `none` = blanco, sin fondo.
 *
 * Cada fondo trae su acento: el color de selección de toda la app (botones,
 * chips activos, fechas, pestañas…) cuando eliges ese fondo. `accent` tiene un
 * contraste de al menos 3:1 sobre blanco; `accentSoft` es su fondo muy claro.
 * Sin fondo y Aurora usan el violeta de la marca.
 */
export const PROFILE_BACKGROUNDS = {
  none: {
    label: 'Sin fondo',
    from: '#FFFFFF',
    to: '#FFFFFF',
    accent: '#8F78F5',
    accentSoft: '#EFEBFF',
  },
  aurora: {
    label: 'Aurora',
    from: '#DBD0FF',
    to: '#FFD3C6',
    accent: '#8F78F5',
    accentSoft: '#EFEBFF',
  }, // lavanda → melocotón, la marca
  atardecer: {
    label: 'Atardecer',
    from: '#FFD3C4',
    to: '#FFECB7',
    accent: '#E8694A',
    accentSoft: '#FFEDE7',
  }, // coral → miel
  menta: {
    label: 'Menta',
    from: '#C6F5E0',
    to: '#CBDDFF',
    accent: '#21986F',
    accentSoft: '#E2F5EE',
  }, // menta → cielo
  cielo: {
    label: 'Cielo',
    from: '#CADFFF',
    to: '#E2D1FF',
    accent: '#3B7FE0',
    accentSoft: '#E6EFFF',
  }, // azul → lila
  rosa: { label: 'Rosa', from: '#FFCEE1', to: '#D7D0FF', accent: '#D9558C', accentSoft: '#FFE8F1' }, // rosa → lavanda
  limon: {
    label: 'Limón',
    from: '#FAF7B0',
    to: '#C5F2D7',
    accent: '#86931A',
    accentSoft: '#F3F5DA',
  }, // limón → menta
  mar: { label: 'Mar', from: '#C2F1F4', to: '#FFD5C8', accent: '#14929A', accentSoft: '#DFF4F5' }, // turquesa → melocotón (complementarios)
  niebla: {
    label: 'Niebla',
    from: '#E6DFF5',
    to: '#D3DEEE',
    accent: '#6E719C',
    accentSoft: '#EEEFF6',
  }, // gris lila → gris azul
  orquidea: {
    label: 'Orquídea',
    from: '#F1CEFC',
    to: '#FFD4E2',
    accent: '#A852C7',
    accentSoft: '#F6E8FB',
  }, // orquídea → rosa palo
  pistacho: {
    label: 'Pistacho',
    from: '#DEF5C3',
    to: '#FFEDC7',
    accent: '#5F9A3A',
    accentSoft: '#EAF4E1',
  }, // pistacho → vainilla
  glaciar: {
    label: 'Glaciar',
    from: '#C9F0FC',
    to: '#D7D2FF',
    accent: '#2391B8',
    accentSoft: '#E2F3FA',
  }, // hielo → lavanda
  mandarina: {
    label: 'Mandarina',
    from: '#FFDBBA',
    to: '#FFCBD6',
    accent: '#DD6B1F',
    accentSoft: '#FFEDDF',
  }, // mandarina → rosa
  salvia: {
    label: 'Salvia',
    from: '#D4E9D6',
    to: '#E4D8F5',
    accent: '#5C8A67',
    accentSoft: '#E7EFE8',
  }, // salvia → lila (complementarios)
  crepusculo: {
    label: 'Crepúsculo',
    from: '#D1CCFD',
    to: '#FEC7D9',
    accent: '#6E5FD8',
    accentSoft: '#ECE9FD',
  }, // índigo claro → rosa
  vainilla: {
    label: 'Vainilla',
    from: '#FFF1CA',
    to: '#E8D6FF',
    accent: '#B8862A',
    accentSoft: '#FAF1DC',
  }, // vainilla → lila (complementarios)
  laguna: {
    label: 'Laguna',
    from: '#C4F2EC',
    to: '#FFE8C6',
    accent: '#16968A',
    accentSoft: '#DEF4F1',
  }, // aguamarina → albaricoque
} as const;

export type ProfileBackground = keyof typeof PROFILE_BACKGROUNDS;

/** Degradado del fondo del perfil, en diagonal de `from` a `to`. */
export function profileGradient(key: ProfileBackground) {
  const { from, to } = PROFILE_BACKGROUNDS[key] ?? PROFILE_BACKGROUNDS.none;
  return `linear-gradient(160deg, ${from}, ${to})`;
}

/**
 * Colores de la app según el fondo del perfil (useTheme): el de selección, su
 * fondo claro y los tres tonos de las "eee" del logo de Inicio, de claro a oscuro.
 */
export type Theme = { accent: string; accentSoft: string; logo: [string, string, string] };

// Cuánto blanco llevan los dos primeros tonos de las "eee" (el tercero es el acento)
const LOGO_TINTS = [0.6, 0.3];

/** `hex` mezclado con blanco: 0 = el color tal cual, 1 = blanco. */
export function tint(hex: string, amount: number) {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(c + (255 - c) * amount)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

export function themeFor(key: ProfileBackground): Theme {
  const { accent, accentSoft } = PROFILE_BACKGROUNDS[key] ?? PROFILE_BACKGROUNDS.none;
  // Sin fondo, el salmón de la marca; con fondo, la escala de su acento, en armonía con él
  const logo: Theme['logo'] =
    key === 'none' || !(key in PROFILE_BACKGROUNDS)
      ? [COLORS.peach, COLORS.peachMid, COLORS.peachDeep]
      : [tint(accent, LOGO_TINTS[0]), tint(accent, LOGO_TINTS[1]), accent];
  return { accent, accentSoft, logo };
}

/**
 * Colores de los tipos de turno (pestaña Turnos): `fill` es el fondo del día en
 * el calendario y `ink`, su abreviatura y su punto en la leyenda. `ink` tiene
 * un contraste de al menos 4,5:1 sobre `fill` (lo comprueba `theme.test.ts`).
 */
export const SHIFT_COLORS = {
  sol: { label: 'Sol', fill: '#FFF0C2', ink: '#8A5A00' },
  coral: { label: 'Coral', fill: '#FFDCD2', ink: '#B23A1E' },
  indigo: { label: 'Índigo', fill: '#DCD8FF', ink: '#4434B0' },
  menta: { label: 'Menta', fill: '#CFF3E3', ink: '#17694D' },
  cielo: { label: 'Cielo', fill: '#D3E6FF', ink: '#1D5BAF' },
  rosa: { label: 'Rosa', fill: '#FFD6E7', ink: '#A12E62' },
  lila: { label: 'Lila', fill: '#EED8FB', ink: '#7A3399' },
  pizarra: { label: 'Pizarra', fill: '#E3E5EC', ink: '#3F4459' },
  verde: { label: 'Verde', fill: '#C9EFC9', ink: '#1E6B2A' },
  rojo: { label: 'Rojo', fill: '#FFCFCF', ink: '#A51D24' },
} as const;

export type ShiftColor = keyof typeof SHIFT_COLORS;

export const DEFAULT_SHIFT_COLOR: ShiftColor = 'cielo';

/** El color de un tipo de turno; si la clave guardada ya no existe, el de por defecto. */
export function shiftColor(key: string) {
  return SHIFT_COLORS[key as ShiftColor] ?? SHIFT_COLORS[DEFAULT_SHIFT_COLOR];
}

/**
 * Pastilla de disponibilidad (DayStage), con los colores de turno: verde si es
 * tu día libre, ámbar si cabe antes o después del turno y gris si trabajas.
 */
export const AVAILABILITY_COLORS = {
  libre: SHIFT_COLORS.menta,
  'tras-turno': SHIFT_COLORS.sol,
  'antes-turno': SHIFT_COLORS.sol,
  trabajas: SHIFT_COLORS.pizarra,
} as const;
