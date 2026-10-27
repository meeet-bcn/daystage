// Social (funciones puras): perfiles públicos de otras personas, amigos
// (seguimiento mutuo), días libres que se comparten y textos de "amigos que van".

import { addDays, type ShiftPlan, workTypeForDate } from '@/data/shifts';

/** Lo que se ve de otra persona. */
export type PublicProfile = { id: string; nick: string; name: string; photo: string | null };

export type ProfileRow = {
  id: string;
  nick: string | null;
  name: string | null;
  photo_url: string | null;
};

export function profileFromRow(row: ProfileRow): PublicProfile {
  return { id: row.id, nick: row.nick ?? '', name: row.name ?? '', photo: row.photo_url };
}

/** Cómo se nombra a alguien: su nombre o, si no tiene, @nick. */
export function displayName(p: Pick<PublicProfile, 'name' | 'nick'>) {
  return p.name.trim() || (p.nick ? `@${p.nick}` : 'Alguien');
}

/** Amigos = quienes te siguen y a quienes sigues. */
export function mutualIds(followers: string[], following: string[]) {
  const back = new Set(followers);
  return following.filter((id) => back.has(id));
}

export type SharedDay = { day: string; status: 'libre' | 'trabaja' };

/** Días que se comparten (desde `from`, `count` días): solo libre o trabaja, nunca el turno. Vacaciones = libre. */
export function daysToShare(plan: ShiftPlan, from: string, count: number): SharedDay[] {
  return Array.from({ length: count }, (_, i) => {
    const day = addDays(from, i);
    return { day, status: workTypeForDate(day, plan) ? 'trabaja' : 'libre' };
  });
}

/** «Ana va», «Ana y Bruno van», «Ana, Bruno y 3 más van» (o «están libres»). */
export function friendsLabel(people: Pick<PublicProfile, 'name' | 'nick'>[], verb: 'van' | 'libres') {
  if (people.length === 0) return '';
  const names = people.map(displayName);
  const one = people.length === 1;
  const tail = verb === 'van' ? (one ? 'va' : 'van') : one ? 'está libre' : 'están libres';
  if (names.length === 1) return `${names[0]} ${tail}`;
  if (names.length === 2) return `${names[0]} y ${names[1]} ${tail}`;
  return `${names[0]}, ${names[1]} y ${names.length - 2} más ${tail}`;
}

/** Lo que se escribe en el buscador de amigos → patrón para el nick ("@Ana " → "ana"). */
export function nickQuery(text: string) {
  return text.trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._]/g, '');
}
