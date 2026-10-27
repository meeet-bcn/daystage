// Ajustes de la app (Perfil › engranaje). Viven en el móvil (storage.ts).
// Aún no hay cuentas ni servidor: la privacidad y las notificaciones se
// guardan como preferencia y se aplicarán cuando existan.

import { LANGUAGES } from '@/data/filters';

export type MessagesFrom = 'everyone' | 'going';

export type Settings = {
  /** Tu idioma principal (código de LANGUAGES), para conocer a gente que lo habla. */
  mainLanguage: string;
  notifications: {
    /** Mensajes nuevos en los chats de tus conciertos. */
    chat: boolean;
    /** Aviso el día antes de cada concierto al que vas. */
    reminders: boolean;
    /** Conciertos nuevos de artistas que te gustan. */
    newConcerts: boolean;
  };
  /** Solo te ven quienes sigues. */
  privateProfile: boolean;
  /** Tus planes en la cuadrícula de tu perfil, para los demás. */
  showPlans: boolean;
  /** Quién puede escribirte por privado. */
  messagesFrom: MessagesFrom;
  /** Vibración al darle a "Meeet In!" y en otras acciones. */
  haptics: boolean;
  /** Sonidos de la interfaz (p. ej. al recargar Inicio). */
  sounds: boolean;
  /** DayStage: minutos que necesitas tras acabar el turno para llegar a un concierto. */
  shiftMarginMinutes: number;
  /** Compartir tus próximos días (libre o trabajas) con tus amigos (os seguís los dos). */
  shareDays: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  mainLanguage: 'es',
  notifications: { chat: true, reminders: true, newConcerts: false },
  privateProfile: false,
  showPlans: true,
  messagesFrom: 'going',
  haptics: true,
  sounds: true,
  shiftMarginMinutes: 60,
  shareDays: false,
};

export const MESSAGES_FROM_OPTIONS: { key: MessagesFrom; label: string }[] = [
  { key: 'everyone', label: 'Todo el mundo' },
  { key: 'going', label: 'Quien va a tus conciertos' },
];

/** Ajustes guardados sobre los de por defecto: los campos nuevos toman su valor inicial. */
export function withDefaults(saved: Partial<Settings>): Settings {
  const known = LANGUAGES.some((l) => l.code === saved.mainLanguage);
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    mainLanguage: known ? (saved.mainLanguage as string) : DEFAULT_SETTINGS.mainLanguage,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...saved.notifications },
    shiftMarginMinutes:
      typeof saved.shiftMarginMinutes === 'number' && saved.shiftMarginMinutes >= 0
        ? saved.shiftMarginMinutes
        : DEFAULT_SETTINGS.shiftMarginMinutes,
  };
}

export function languageLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}
