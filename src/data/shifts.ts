// Turnos de trabajo: tipos de turno, rotación cíclica y cambios de un día
// concreto. Funciones puras (sin React Native), para la pestaña Turnos y para
// saber si puedes ir a un concierto.
//
// Las fechas son días locales en texto 'YYYY-MM-DD' (sin hora ni zona): así un
// cambio de hora no mueve un turno de día. Para sumar días se usa UTC, que no
// tiene cambios de hora; las horas reales (ms) se calculan con la hora local
// del móvil, que sí los tiene: la noche del último domingo de octubre dura una
// hora más y la del de marzo, una menos.

import type { ShiftColor } from '@/theme';

export type ShiftType = {
  id: string;
  /** "Mañana" */
  name: string;
  /** "M": lo que se ve en cada día del calendario (1–3 letras). */
  abbr: string;
  /** Color de la paleta SHIFT_COLORS (theme.ts). */
  color: ShiftColor;
  /** 'HH:MM' */
  start: string;
  /** 'HH:MM'. Si es igual o anterior a `start`, el turno acaba al día siguiente. */
  end: string;
  /** Descanso no trabajado dentro del turno. */
  breakMinutes: number;
  /**
   * Todo el día libre (vacaciones, asuntos propios…): se ve en el calendario
   * con su color, pero cuenta como día libre; `start`/`end` no se usan.
   */
  off?: boolean;
};

/** Secuencia que se repite desde `startDate`: cada posición es un día, `null` = libre. */
export type Rotation = {
  id: string;
  name: string;
  startDate: string;
  cycle: (string | null)[];
};

/** Un día que no sigue la rotación: otro turno, o libre (`shiftTypeId: null`). */
export type DayOverride = {
  date: string;
  shiftTypeId: string | null;
  note?: string;
};

/** Todo lo que hace falta para saber qué turno toca cada día. */
export type ShiftPlan = {
  types: ShiftType[];
  rotation: Rotation | null;
  /** Por fecha. */
  overrides: Record<string, DayOverride>;
};

export type Interval = { start: number; end: number };

export type Availability = 'libre' | 'tras-turno' | 'antes-turno' | 'trabajas';

export const EMPTY_PLAN: ShiftPlan = { types: [], rotation: null, overrides: {} };

/** Tipos con los que nace la base de datos (shift-db.ts). */
export const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  { id: 'manana', name: 'Mañana', abbr: 'M', color: 'sol', start: '06:00', end: '14:00', breakMinutes: 0 },
  { id: 'tarde', name: 'Tarde', abbr: 'T', color: 'coral', start: '14:00', end: '22:00', breakMinutes: 0 },
  { id: 'noche', name: 'Noche', abbr: 'N', color: 'indigo', start: '22:00', end: '06:00', breakMinutes: 0 },
];

/** Plantilla del asistente: 2 mañanas, 2 tardes, 2 noches y 4 libres (ciclo de 10 días). */
export function templateCycle(morning: string, afternoon: string, night: string) {
  return [morning, morning, afternoon, afternoon, night, night, null, null, null, null];
}

// --- Fechas ----------------------------------------------------------------

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_MS = 86_400_000;

export function isDateKey(value: string) {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = new Date(Date.UTC(y, mo - 1, d));
  return utc.getUTCMonth() === mo - 1 && utc.getUTCDate() === d;
}

export function isTime(value: string) {
  return TIME_RE.test(value);
}

function parts(date: string): [number, number, number] {
  const m = DATE_RE.exec(date);
  if (!m) throw new Error(`Fecha no válida: ${date}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** La fecha local de un instante (o de hoy). */
export function toDateKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(date: string, days: number) {
  const [y, m, d] = parts(date);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

/** Días de `from` a `to` (negativo si `to` es anterior). */
export function daysBetween(from: string, to: string) {
  const [y1, m1, d1] = parts(from);
  const [y2, m2, d2] = parts(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS);
}

/** 0 = lunes … 6 = domingo. */
export function weekdayIndex(date: string) {
  const [y, m, d] = parts(date);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

function minutesOf(time: string) {
  const m = TIME_RE.exec(time);
  if (!m) throw new Error(`Hora no válida: ${time}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Medianoche local de `date` + `minutes` (puede pasar al día siguiente), en ms. */
function localTime(date: string, minutes: number) {
  const [y, m, d] = parts(date);
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60).getTime();
}

// --- Turnos ------------------------------------------------------------------

/** Si acaba al día siguiente (`end` igual o anterior a `start`; igual = 24 h). */
export function crossesMidnight(type: Pick<ShiftType, 'start' | 'end'>) {
  return minutesOf(type.end) <= minutesOf(type.start);
}

/** Minutos de entrada a salida (con el descanso). */
export function shiftSpanMinutes(type: Pick<ShiftType, 'start' | 'end'>) {
  const start = minutesOf(type.start);
  let end = minutesOf(type.end);
  if (end <= start) end += 24 * 60;
  return end - start;
}

/**
 * Descanso que se propone para un horario: en jornadas de 9 h de entrada a
 * salida, 1 h que no computa (se queda en 8 h). En las demás, ninguno.
 */
export function defaultBreakMinutes(type: Pick<ShiftType, 'start' | 'end'>) {
  return shiftSpanMinutes(type) === 9 * 60 ? 60 : 0;
}

/** Horas trabajadas según el horario (sin el descanso). No cuenta el cambio de hora. */
export function shiftHours(type: Pick<ShiftType, 'start' | 'end' | 'breakMinutes' | 'off'>) {
  if (type.off) return 0;
  const start = minutesOf(type.start);
  let end = minutesOf(type.end);
  if (end <= start) end += 24 * 60;
  return Math.max(0, end - start - type.breakMinutes) / 60;
}

/** Inicio y fin reales (ms locales) del turno que empieza en `date`. */
export function shiftInterval(date: string, type: Pick<ShiftType, 'start' | 'end'>): Interval {
  const start = localTime(date, minutesOf(type.start));
  const endDate = crossesMidnight(type) ? addDays(date, 1) : date;
  return { start, end: localTime(endDate, minutesOf(type.end)) };
}

/** Id del turno que empieza en `date` (o null si es libre): el cambio del día o, si no, la rotación. */
export function shiftForDate(
  date: string,
  rotation: Rotation | null,
  overrides: Record<string, DayOverride> = {},
): string | null {
  const override = overrides[date];
  if (override) return override.shiftTypeId;
  if (!rotation || rotation.cycle.length === 0) return null;
  const n = rotation.cycle.length;
  // Módulo positivo: antes del inicio, el ciclo sigue hacia atrás
  const index = ((daysBetween(rotation.startDate, date) % n) + n) % n;
  return rotation.cycle[index] ?? null;
}

/** El tipo de turno que empieza en `date`, o null si es libre (o su tipo ya no existe). */
export function typeForDate(date: string, plan: ShiftPlan): ShiftType | null {
  const id = shiftForDate(date, plan.rotation, plan.overrides);
  return id == null ? null : (plan.types.find((t) => t.id === id) ?? null);
}

/** El turno de trabajo que empieza en `date`: como typeForDate, pero un tipo `off` (vacaciones) es libre. */
export function workTypeForDate(date: string, plan: ShiftPlan): ShiftType | null {
  const type = typeForDate(date, plan);
  return type && !type.off ? type : null;
}

/** Turnos que ocupan parte de `date`: el que acaba esta mañana (de la noche anterior) y el de hoy. */
export function busyIntervals(date: string, plan: ShiftPlan): Interval[] {
  const dayStart = localTime(date, 0);
  const dayEnd = localTime(addDays(date, 1), 0);
  const out: Interval[] = [];
  for (const d of [addDays(date, -1), date]) {
    const type = workTypeForDate(d, plan);
    if (!type) continue;
    const { start, end } = shiftInterval(d, type);
    if (end > dayStart && start < dayEnd) {
      out.push({ start: Math.max(start, dayStart), end: Math.min(end, dayEnd) });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Huecos libres de `date` (de medianoche a medianoche, en ms locales). */
export function freeWindows(date: string, plan: ShiftPlan): Interval[] {
  const dayStart = localTime(date, 0);
  const dayEnd = localTime(addDays(date, 1), 0);
  const free: Interval[] = [];
  let cursor = dayStart;
  for (const busy of busyIntervals(date, plan)) {
    if (busy.start > cursor) free.push({ start: cursor, end: busy.start });
    cursor = Math.max(cursor, busy.end);
  }
  if (cursor < dayEnd) free.push({ start: cursor, end: dayEnd });
  return free;
}

export type AvailabilityOptions = {
  /** Lo que necesitas tras acabar el turno para llegar (por defecto, 60 min). */
  marginMinutes?: number;
  /** Lo que se da por hecho que dura un concierto, para ver si choca con el turno siguiente. */
  concertMinutes?: number;
};

/**
 * ¿Puedes ir a un concierto que empieza en `concertStartsAt` (ms)?
 * - 'trabajas': el concierto (con su duración) choca con un turno o con el
 *   margen tras acabarlo, o un turno empieza antes de que termine.
 * - 'tras-turno': ese día trabajas, pero el turno acaba con margen suficiente.
 * - 'antes-turno': ese día trabajas más tarde, pero el concierto acaba antes.
 * - 'libre': ese día no trabajas.
 */
export function availabilityFor(
  concertStartsAt: number,
  plan: ShiftPlan,
  { marginMinutes = 60, concertMinutes = 180 }: AvailabilityOptions = {},
): Availability {
  const date = toDateKey(new Date(concertStartsAt));
  const concertEnd = concertStartsAt + concertMinutes * 60_000;
  const dayStart = localTime(date, 0);
  const dayEnd = localTime(addDays(date, 1), 0);
  let workedBefore = false;
  let worksLater = false;
  for (const d of [addDays(date, -1), date, addDays(date, 1)]) {
    const type = workTypeForDate(d, plan);
    if (!type) continue;
    const { start, end } = shiftInterval(d, type);
    if (concertStartsAt < end + marginMinutes * 60_000 && concertEnd > start) return 'trabajas';
    // Un turno que ocupa parte del día del concierto: ya acabado, o que empieza después
    if (end <= concertStartsAt && end > dayStart) workedBefore = true;
    if (start >= concertEnd && start < dayEnd) worksLater = true;
  }
  return workedBefore ? 'tras-turno' : worksLater ? 'antes-turno' : 'libre';
}

// --- Calendario ----------------------------------------------------------------

export type GridDay = { date: string; inMonth: boolean };

/** Semanas (de lunes a domingo) que cubren el mes; `month` de 1 a 12. */
export function monthGrid(year: number, month: number): GridDay[][] {
  const first = `${year}-${pad(month)}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const start = addDays(first, -weekdayIndex(first));
  const weeks = Math.ceil((weekdayIndex(first) + daysInMonth) / 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, w * 7 + i);
      return { date, inMonth: date.slice(0, 7) === first.slice(0, 7) };
    }),
  );
}

export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
export const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
/** Cabecera del calendario: L M X J V S D. */
export const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** "lunes, 27 de octubre" */
export function formatDay(date: string) {
  const [, m, d] = parts(date);
  return `${WEEKDAYS[weekdayIndex(date)]}, ${d} de ${MONTHS[m - 1]}`;
}

/** "Octubre 2026" */
export function formatMonth(year: number, month: number) {
  const name = MONTHS[month - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${year}`;
}

/** "06:00–14:00"; un día libre (vacaciones), "Todo el día". */
export function formatShiftTime(type: Pick<ShiftType, 'start' | 'end' | 'off'>) {
  return type.off ? 'Todo el día' : `${type.start}–${type.end}`;
}

/** "630" o "6:30" → "06:30" mientras escribes; si no se entiende, tal cual. */
export function normalizeTimeInput(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (text.includes(':')) {
    const [h, m = ''] = text.split(':');
    return `${h.replace(/\D/g, '').padStart(2, '0').slice(-2)}:${m.replace(/\D/g, '').slice(0, 2)}`;
  }
  if (digits.length === 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`;
  return digits;
}

/** "08:45" → "8:45" (en el calendario, como en un horario impreso). */
export function shortTime(time: string) {
  return time.replace(/^0(\d)/, '$1');
}

/** Id nuevo para un tipo o una rotación (único en este móvil). */
export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
