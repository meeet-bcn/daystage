// Los planes del usuario (conciertos a los que ha dicho "Voy"), separados en
// los que vienen y los que ya pasaron, para el perfil y la pestaña meeet in.

import type { Concert } from '@/data/concerts';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Un concierto pasa a "ya fui" cuando acaba su día, no cuando empieza. */
export function isPast(concert: Concert, now = new Date()) {
  return concert.startsAt != null && concert.startsAt < startOfDay(now);
}

/**
 * Próximos (el más cercano primero; sin fecha al final) y pasados (el más
 * reciente primero), que es el orden en que se leen en el perfil.
 */
export function splitPlans(plans: Concert[], now = new Date()) {
  const upcoming = plans
    .filter((c) => !isPast(c, now))
    .sort((a, b) => (a.startsAt ?? Infinity) - (b.startsAt ?? Infinity));
  const past = plans
    .filter((c) => isPast(c, now))
    .sort((a, b) => b.startsAt! - a.startsAt!);
  return { upcoming, past };
}

/** "3 personas van contigo" / "1 persona fue contigo" (sin contarte a ti). */
export function companionsLabel(others: number, past: boolean) {
  if (others <= 0) return past ? 'Fuiste' : 'Aún nadie más';
  const people = others === 1 ? '1 persona' : `${others} personas`;
  const verb = past ? (others === 1 ? 'fue' : 'fueron') : others === 1 ? 'va' : 'van';
  return `${people} ${verb} contigo`;
}
