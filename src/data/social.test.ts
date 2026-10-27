import { describe, expect, it } from '@jest/globals';

import { DEFAULT_SHIFT_TYPES, type ShiftPlan, templateCycle } from '@/data/shifts';
import {
  daysToShare,
  displayName,
  friendsLabel,
  mutualIds,
  nickQuery,
  profileFromRow,
} from '@/data/social';

const plan: ShiftPlan = {
  types: DEFAULT_SHIFT_TYPES,
  rotation: { id: 'r', name: 'R', startDate: '2026-10-01', cycle: templateCycle('manana', 'tarde', 'noche') },
  overrides: { '2026-10-08': { date: '2026-10-08', shiftTypeId: 'tarde' } },
};

describe('profileFromRow y displayName', () => {
  it('nombre o, si no hay, @nick', () => {
    const p = profileFromRow({ id: 'u1', nick: 'ana.bcn', name: null, photo_url: null });
    expect(p).toEqual({ id: 'u1', nick: 'ana.bcn', name: '', photo: null });
    expect(displayName(p)).toBe('@ana.bcn');
    expect(displayName({ name: 'Ana', nick: 'ana.bcn' })).toBe('Ana');
    expect(displayName({ name: ' ', nick: '' })).toBe('Alguien');
  });
});

describe('mutualIds', () => {
  it('solo quienes os seguís los dos', () => {
    expect(mutualIds(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c']);
    expect(mutualIds([], ['a'])).toEqual([]);
  });
});

describe('daysToShare', () => {
  it('libre o trabaja por día, con los cambios del día y sin el tipo de turno', () => {
    const days = daysToShare(plan, '2026-10-05', 5);
    expect(days).toEqual([
      { day: '2026-10-05', status: 'trabaja' },
      { day: '2026-10-06', status: 'trabaja' },
      { day: '2026-10-07', status: 'libre' },
      { day: '2026-10-08', status: 'trabaja' }, // cambiado a tarde
      { day: '2026-10-09', status: 'libre' },
    ]);
  });

  it('las vacaciones cuentan como libre', () => {
    const vac = { id: 'vac', name: 'Vacaciones', abbr: 'VAC', color: 'sol' as const, start: '00:00', end: '00:00', breakMinutes: 0, off: true };
    const withVac: ShiftPlan = { ...plan, types: [...plan.types, vac], overrides: { '2026-10-05': { date: '2026-10-05', shiftTypeId: 'vac' } } };
    expect(daysToShare(withVac, '2026-10-05', 1)).toEqual([{ day: '2026-10-05', status: 'libre' }]);
  });

  it('sin rotación, todo libre', () => {
    expect(daysToShare({ ...plan, rotation: null, overrides: {} }, '2026-10-25', 2)).toEqual([
      { day: '2026-10-25', status: 'libre' },
      { day: '2026-10-26', status: 'libre' },
    ]);
  });
});

describe('friendsLabel', () => {
  const ana = { name: 'Ana', nick: 'ana' };
  const bruno = { name: '', nick: 'bruno' };
  const carla = { name: 'Carla', nick: 'carla' };
  const dani = { name: 'Dani', nick: 'dani' };

  it('van', () => {
    expect(friendsLabel([ana], 'van')).toBe('Ana va');
    expect(friendsLabel([ana, bruno], 'van')).toBe('Ana y @bruno van');
    expect(friendsLabel([ana, bruno, carla, dani], 'van')).toBe('Ana, @bruno y 2 más van');
    expect(friendsLabel([], 'van')).toBe('');
  });

  it('libres', () => {
    expect(friendsLabel([carla], 'libres')).toBe('Carla está libre');
    expect(friendsLabel([carla, dani], 'libres')).toBe('Carla y Dani están libres');
  });
});

describe('nickQuery', () => {
  it('quita @, espacios y lo que no puede ir en un nick', () => {
    expect(nickQuery('  @Ana.BCN ')).toBe('ana.bcn');
    expect(nickQuery('ana%_')).toBe('ana_');
    expect(nickQuery('')).toBe('');
  });
});
