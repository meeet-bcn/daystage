// Importar turnos pegando un texto (Turnos › Importar): una entrada por día,
// "AAMMDD=HH:MM-HH:MM" o "AAMMDD=V" (vacaciones, todo el día libre), separadas
// por espacios, comas o saltos de línea. Por ejemplo:
//   330301=7:30-15:30 330302=14:00-22:00 330303=V
// Cada horario distinto es un tipo de turno: de mañana (verde) si acaba a las
// 19:00 o antes, de tarde (rojo) si acaba más tarde; las vacaciones, ámbar.
// Los de 9 h de entrada a salida llevan 1 h de descanso que no computa.

import { type DayOverride, defaultBreakMinutes, isDateKey, isTime, type ShiftType } from '@/data/shifts';

export type ImportEntry =
  | { date: string; kind: 'work'; start: string; end: string }
  | { date: string; kind: 'off' };

export type ParseResult = { entries: ImportEntry[]; errors: string[] };

const ENTRY_RE = /^(\d{2})(\d{2})(\d{2})=(.+)$/;
const RANGE_RE = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;
const OFF_WORDS = /^(v|vac|vacaciones|libre|l)$/i;

const pad = (n: string) => n.padStart(2, '0');

export function parseShiftList(text: string): ParseResult {
  const entries = new Map<string, ImportEntry>();
  const errors: string[] = [];
  for (const token of text.split(/[\s,;]+/).filter(Boolean)) {
    const m = ENTRY_RE.exec(token);
    const date = m ? `20${m[1]}-${m[2]}-${m[3]}` : '';
    if (!m || !isDateKey(date)) {
      errors.push(`No se entiende «${token}»`);
      continue;
    }
    const value = m[4].trim();
    if (OFF_WORDS.test(value)) {
      entries.set(date, { date, kind: 'off' });
      continue;
    }
    const r = RANGE_RE.exec(value);
    const start = r ? `${pad(r[1])}:${r[2]}` : '';
    const end = r ? `${pad(r[3])}:${r[4]}` : '';
    if (!r || !isTime(start) || !isTime(end)) {
      errors.push(`Horario no válido en «${token}»`);
      continue;
    }
    // Si un día sale dos veces, vale el último
    entries.set(date, { date, kind: 'work', start, end });
  }
  return {
    entries: [...entries.values()].sort((a, b) => a.date.localeCompare(b.date)),
    errors,
  };
}

/** Mañana si acaba a las 19:00 o antes; tarde si acaba más tarde (o al día siguiente). */
export function classifyShift(start: string, end: string): 'manana' | 'tarde' {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const crosses = toMin(end) <= toMin(start);
  return !crosses && toMin(end) <= 19 * 60 ? 'manana' : 'tarde';
}

export const VACATION_TYPE_ID = 'import-vacaciones';

/** Id estable por horario, para no duplicar tipos al importar dos veces: "import-0845-1745". */
export const importTypeId = (start: string, end: string) =>
  `import-${start.replace(':', '')}-${end.replace(':', '')}`;

/**
 * Los tipos que hacen falta (uno por horario, más Vacaciones) y los cambios de
 * cada día. Los tipos que ya existen (mismo id) no se repiten.
 */
export function buildImport(entries: ImportEntry[], existing: ShiftType[]) {
  const have = new Set(existing.map((t) => t.id));
  const types = new Map<string, ShiftType>();
  const overrides: DayOverride[] = [];

  for (const e of entries) {
    let id: string;
    if (e.kind === 'off') {
      id = VACATION_TYPE_ID;
      if (!have.has(id) && !types.has(id)) {
        types.set(id, {
          id,
          name: 'Vacaciones',
          abbr: 'VAC',
          color: 'sol',
          start: '00:00',
          end: '00:00',
          breakMinutes: 0,
          off: true,
        });
      }
    } else {
      id = importTypeId(e.start, e.end);
      if (!have.has(id) && !types.has(id)) {
        const morning = classifyShift(e.start, e.end) === 'manana';
        types.set(id, {
          id,
          name: `${morning ? 'Mañana' : 'Tarde'} ${e.start}–${e.end}`,
          abbr: morning ? 'M' : 'T',
          color: morning ? 'verde' : 'rojo',
          start: e.start,
          end: e.end,
          // Las jornadas de 9 h llevan 1 h de descanso que no computa
          breakMinutes: defaultBreakMinutes(e),
        });
      }
    }
    overrides.push({ date: e.date, shiftTypeId: id });
  }

  // Primero los de mañana, luego los de tarde y al final Vacaciones; cada grupo por hora
  const order = (t: ShiftType) => (t.off ? 2 : t.color === 'verde' ? 0 : 1);
  const newTypes = [...types.values()].sort(
    (a, b) => order(a) - order(b) || a.start.localeCompare(b.start) || a.end.localeCompare(b.end)
  );
  return { newTypes, overrides };
}
