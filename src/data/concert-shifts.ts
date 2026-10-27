// Conciertos × turnos: si puedes ir a cada concierto según tu rotación y los
// cambios de día (shifts.ts). Funciones puras, para Inicio, la ficha, Turnos y
// Descubrir.

import type { Concert } from '@/data/concerts';
import {
  availabilityFor,
  type Availability,
  type ShiftPlan,
  toDateKey,
} from '@/data/shifts';

export type { Availability };

/** Textos de la pastilla de disponibilidad. */
export const AVAILABILITY_LABELS: Record<Availability, string> = {
  libre: 'Día libre',
  'tras-turno': 'Tras tu turno',
  'antes-turno': 'Antes de tu turno',
  trabajas: 'Trabajas',
};

/** Margen tras el turno que se puede elegir en Ajustes (minutos). */
export const SHIFT_MARGIN_OPTIONS = [0, 30, 60, 90, 120];

/** ¿Hay turnos configurados? Sin rotación ni cambios, no se etiqueta nada. */
export function hasSchedule(plan: ShiftPlan) {
  return (
    (plan.rotation != null && plan.rotation.cycle.length > 0) ||
    Object.keys(plan.overrides).length > 0
  );
}

/** Hora que se supone a un concierto sin hora (las fuentes lo dejan a las 00:00). */
export const ASSUMED_CONCERT_HOUR = 21;

/**
 * Cuándo empieza el concierto para cruzarlo con los turnos. Las fuentes ponen
 * las 00:00 cuando no saben la hora (`toTimestamp`): entonces se supone la
 * noche de ese día, que es cuando son casi todos.
 */
export function effectiveStart(startsAt: number) {
  const d = new Date(startsAt);
  const midnight = d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;
  return midnight ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), ASSUMED_CONCERT_HOUR).getTime() : startsAt;
}

/** Disponibilidad para un concierto, o null si no tiene fecha o no hay turnos configurados. */
export function concertAvailability(
  concert: Pick<Concert, 'startsAt'>,
  plan: ShiftPlan,
  marginMinutes = 60,
): Availability | null {
  if (concert.startsAt == null || !hasSchedule(plan)) return null;
  return availabilityFor(effectiveStart(concert.startsAt), plan, { marginMinutes });
}

/** Puedes ir: el día es libre o el concierto cabe antes o después del turno. */
export function canGo(availability: Availability | null) {
  return availability != null && availability !== 'trabajas';
}

/** Conciertos por día local ('YYYY-MM-DD'), en orden de hora (para el mes de Turnos). */
export function concertsByDate(concerts: Concert[]): Record<string, Concert[]> {
  const out: Record<string, Concert[]> = {};
  for (const c of concerts) {
    if (c.startsAt == null) continue;
    (out[toDateKey(new Date(c.startsAt))] ??= []).push(c);
  }
  for (const list of Object.values(out)) list.sort((a, b) => a.startsAt! - b.startsAt!);
  return out;
}

/**
 * Tus planes ("¡Voy!", también los pasados) de un mes, por fecha y hora:
 * los que se ven en el calendario de Turnos. `month` de 1 a 12.
 */
export function plansInMonth(plans: Concert[], year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  return Object.entries(concertsByDate(plans))
    .filter(([date]) => date.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, list]) => list);
}
