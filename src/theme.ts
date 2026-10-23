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
    from: '#E9E2FF',
    to: '#FFE1D8',
    accent: '#8F78F5',
    accentSoft: '#EFEBFF',
  }, // lavanda → melocotón, la marca
  atardecer: {
    label: 'Atardecer',
    from: '#FFE0D6',
    to: '#FFF1C9',
    accent: '#E8694A',
    accentSoft: '#FFEDE7',
  }, // coral → miel
  menta: {
    label: 'Menta',
    from: '#D8F4E8',
    to: '#DDE9FF',
    accent: '#21986F',
    accentSoft: '#E2F5EE',
  }, // menta → cielo
  cielo: {
    label: 'Cielo',
    from: '#DCEAFF',
    to: '#EDE3FF',
    accent: '#3B7FE0',
    accentSoft: '#E6EFFF',
  }, // azul → lila
  rosa: { label: 'Rosa', from: '#FFE0EC', to: '#E6E2FF', accent: '#D9558C', accentSoft: '#FFE8F1' }, // rosa → lavanda
  limon: {
    label: 'Limón',
    from: '#F6F4C6',
    to: '#D7F2E2',
    accent: '#86931A',
    accentSoft: '#F3F5DA',
  }, // limón → menta
  mar: { label: 'Mar', from: '#D5F1F3', to: '#FFE3DA', accent: '#14929A', accentSoft: '#DFF4F5' }, // turquesa → melocotón (complementarios)
  niebla: {
    label: 'Niebla',
    from: '#F1EEF8',
    to: '#E2E8F1',
    accent: '#6E719C',
    accentSoft: '#EEEFF6',
  }, // gris lila → gris azul
  orquidea: {
    label: 'Orquídea',
    from: '#F4E1FA',
    to: '#FFE6EE',
    accent: '#A852C7',
    accentSoft: '#F6E8FB',
  }, // orquídea → rosa palo
  pistacho: {
    label: 'Pistacho',
    from: '#E6F4D6',
    to: '#FFF3D9',
    accent: '#5F9A3A',
    accentSoft: '#EAF4E1',
  }, // pistacho → vainilla
  glaciar: {
    label: 'Glaciar',
    from: '#DDF3FA',
    to: '#E7E4FF',
    accent: '#2391B8',
    accentSoft: '#E2F3FA',
  }, // hielo → lavanda
  mandarina: {
    label: 'Mandarina',
    from: '#FFE4CC',
    to: '#FFDDE4',
    accent: '#DD6B1F',
    accentSoft: '#FFEDDF',
  }, // mandarina → rosa
  salvia: {
    label: 'Salvia',
    from: '#E2EDE3',
    to: '#EEE8F7',
    accent: '#5C8A67',
    accentSoft: '#E7EFE8',
  }, // salvia → lila (complementarios)
  crepusculo: {
    label: 'Crepúsculo',
    from: '#E3E0FB',
    to: '#FBDCE6',
    accent: '#6E5FD8',
    accentSoft: '#ECE9FD',
  }, // índigo claro → rosa
  vainilla: {
    label: 'Vainilla',
    from: '#FFF6DC',
    to: '#F2E8FF',
    accent: '#B8862A',
    accentSoft: '#FAF1DC',
  }, // vainilla → lila (complementarios)
  laguna: {
    label: 'Laguna',
    from: '#D6F2EE',
    to: '#FFEFD8',
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

/** Colores de selección de la app, según el fondo del perfil (useTheme). */
export type Theme = { accent: string; accentSoft: string };

export function themeFor(key: ProfileBackground): Theme {
  const { accent, accentSoft } = PROFILE_BACKGROUNDS[key] ?? PROFILE_BACKGROUNDS.none;
  return { accent, accentSoft };
}
