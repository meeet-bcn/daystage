// Copia de tus turnos en tu cuenta (Supabase, tabla user_shift_plans): el plan
// entero como un documento. Gana el último cambio. Funciones puras.

import { isDateKey, isTime, type ShiftPlan, type ShiftType } from '@/data/shifts';
import { SHIFT_COLORS } from '@/theme';

export type SyncDecision = 'push' | 'pull' | 'none';

/**
 * Qué hacer al conectar: subir lo del móvil si es más nuevo (o no hay copia),
 * bajar la copia si es más nueva, o nada si coinciden. `null` = no hay.
 */
export function syncDecision(localAt: number | null, remoteAt: number | null): SyncDecision {
  if (remoteAt == null) return localAt == null ? 'none' : 'push';
  if (localAt == null || remoteAt > localAt) return 'pull';
  return localAt > remoteAt ? 'push' : 'none';
}

function cleanType(t: unknown): ShiftType | null {
  if (!t || typeof t !== 'object') return null;
  const x = t as Record<string, unknown>;
  if (typeof x.id !== 'string' || typeof x.name !== 'string' || typeof x.abbr !== 'string') return null;
  if (typeof x.start !== 'string' || typeof x.end !== 'string' || !isTime(x.start) || !isTime(x.end)) {
    return null;
  }
  return {
    id: x.id,
    name: x.name.slice(0, 40),
    abbr: x.abbr.slice(0, 3),
    color: (typeof x.color === 'string' && x.color in SHIFT_COLORS ? x.color : 'cielo') as ShiftType['color'],
    start: x.start,
    end: x.end,
    breakMinutes: typeof x.breakMinutes === 'number' && x.breakMinutes >= 0 ? x.breakMinutes : 0,
    ...(x.off === true ? { off: true } : {}),
  };
}

/** El plan de la copia, comprobado: lo que no encaja se descarta (nunca rompe la app). */
export function planFromJson(json: unknown): ShiftPlan | null {
  if (!json || typeof json !== 'object') return null;
  const x = json as Record<string, unknown>;
  const types = Array.isArray(x.types)
    ? x.types.map(cleanType).filter((t): t is ShiftType => t != null)
    : [];
  const ids = new Set(types.map((t) => t.id));
  const known = (id: unknown) => (typeof id === 'string' && ids.has(id) ? id : null);

  const r = x.rotation as Record<string, unknown> | null | undefined;
  const rotation =
    r &&
    typeof r.id === 'string' &&
    typeof r.startDate === 'string' &&
    isDateKey(r.startDate) &&
    Array.isArray(r.cycle)
      ? {
          id: r.id,
          name: typeof r.name === 'string' ? r.name : 'Mi rotación',
          startDate: r.startDate,
          cycle: r.cycle.map(known),
        }
      : null;

  const overrides: ShiftPlan['overrides'] = {};
  if (x.overrides && typeof x.overrides === 'object') {
    for (const [date, o] of Object.entries(x.overrides as Record<string, unknown>)) {
      if (!isDateKey(date) || !o || typeof o !== 'object') continue;
      const ov = o as Record<string, unknown>;
      overrides[date] = {
        date,
        shiftTypeId: known(ov.shiftTypeId),
        ...(typeof ov.note === 'string' && ov.note ? { note: ov.note } : {}),
      };
    }
  }
  return { types, rotation, overrides };
}
