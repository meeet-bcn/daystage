// Avisos locales (funciones puras): antes de cada turno y el día antes de cada
// concierto al que vas, diciendo si ese día trabajas. Se recalculan enteros
// cada vez que cambian tus turnos, tus planes o los ajustes (notifications.ts).

import type { Concert } from '@/data/concerts';
import { availabilityFor, addDays, shiftInterval, type ShiftPlan, toDateKey, workTypeForDate } from '@/data/shifts';

export type Reminder = { id: string; at: number; title: string; body: string };

export type ReminderOptions = {
  /** Minutos antes del turno; null = sin avisos de turno. */
  shiftLeadMinutes: number | null;
  /** Aviso el día antes de cada concierto con «¡Voy!». */
  concerts: boolean;
  /** Cuántos días por delante (iOS guarda como mucho 64 avisos). */
  days?: number;
};

/** Hora del aviso del día antes de un concierto. */
export const CONCERT_REMINDER_HOUR = 20;
/** iOS no guarda más de 64 avisos programados: se dejan los más cercanos. */
export const MAX_REMINDERS = 60;

const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function planReminders(
  plan: ShiftPlan,
  plans: Concert[],
  now: number,
  { shiftLeadMinutes, concerts, days = 14 }: ReminderOptions
): Reminder[] {
  const out: Reminder[] = [];
  const today = toDateKey(new Date(now));

  if (shiftLeadMinutes != null) {
    for (let i = 0; i <= days; i++) {
      const date = addDays(today, i);
      const type = workTypeForDate(date, plan);
      if (!type) continue;
      const { start, end } = shiftInterval(date, type);
      out.push({
        id: `turno-${date}`,
        at: start - shiftLeadMinutes * 60_000,
        title: `${type.name}: entras a las ${hhmm(start)}`,
        body: `Hoy trabajas de ${hhmm(start)} a ${hhmm(end)}.`,
      });
    }
  }

  if (concerts) {
    const last = new Date(now).getTime() + (days + 1) * 24 * 60 * 60_000;
    for (const c of plans) {
      if (c.startsAt == null || c.startsAt <= now || c.startsAt > last) continue;
      const day = toDateKey(new Date(c.startsAt));
      const [y, m, d] = addDays(day, -1).split('-').map(Number);
      const at = new Date(y, m - 1, d, CONCERT_REMINDER_HOUR).getTime();
      const type = workTypeForDate(day, plan);
      const availability = availabilityFor(c.startsAt, plan);
      const work = !type
        ? 'Ese día libras.'
        : availability === 'trabajas'
          ? `Ojo: ese día trabajas (${type.start}–${type.end}).`
          : `Ese día trabajas (${type.start}–${type.end}), pero te da tiempo.`;
      out.push({
        id: `concierto-${c.id}`,
        at,
        title: `Mañana: ${c.artist}`,
        body: `${c.venue} · ${hhmm(c.startsAt)}. ${work}`,
      });
    }
  }

  return out
    .filter((r) => r.at > now)
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_REMINDERS);
}
