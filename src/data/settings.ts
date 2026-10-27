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
  /** Informes: tu jornada por día (horas), para las horas extra. */
  workdayHours: number;
  /** Informes: lo que cobras por hora (€), o null para no calcular ganancias. */
  hourlyRate: number | null;
  /** Aviso antes de cada turno (minutos), o null para no avisar. */
  shiftReminderMinutes: number | null;
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
  workdayHours: 8,
  hourlyRate: null,
  shiftReminderMinutes: null,
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
    workdayHours:
      typeof saved.workdayHours === 'number' && saved.workdayHours > 0 && saved.workdayHours <= 24
        ? saved.workdayHours
        : DEFAULT_SETTINGS.workdayHours,
    hourlyRate:
      typeof saved.hourlyRate === 'number' && saved.hourlyRate > 0 ? saved.hourlyRate : null,
    shiftReminderMinutes: SHIFT_REMINDER_OPTIONS.includes(saved.shiftReminderMinutes as number)
      ? (saved.shiftReminderMinutes as number)
      : null,
  };
}

export function languageLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

/** Jornadas que se pueden elegir en Ajustes › Turnos (horas por día). */
export const WORKDAY_OPTIONS = [6, 7, 7.5, 8, 9];

/** "12,5" o "12.5" → 12.5; vacío o no válido → null. */
export function parseRate(text: string): number | null {
  const n = Number(text.replace(',', '.').trim());
  return text.trim() && Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Aviso antes del turno que se puede elegir (minutos); null = no avisar. */
export const SHIFT_REMINDER_OPTIONS = [30, 60, 120];
