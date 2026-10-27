import { describe, expect, it } from '@jest/globals';

import { makeConcert } from '@/data/__fixtures__/concert';
import { MAX_REMINDERS, planReminders } from '@/data/reminders';
import { DEFAULT_SHIFT_TYPES, type ShiftPlan, templateCycle } from '@/data/shifts';

// Europe/Madrid. 2M-2T-2N-4L desde el 1 de octubre de 2026 (datos inventados)
const plan: ShiftPlan = {
  types: DEFAULT_SHIFT_TYPES,
  rotation: { id: 'r', name: 'R', startDate: '2026-10-01', cycle: templateCycle('manana', 'tarde', 'noche') },
  overrides: {},
};
const NOW = new Date(2026, 9, 1, 0, 30).getTime();
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();

describe('planReminders · turnos', () => {
  it('un aviso antes de cada turno, con su hora', () => {
    const r = planReminders(plan, [], NOW, { shiftLeadMinutes: 60, concerts: false, days: 5 });
    expect(r.map((x) => x.id)).toEqual([
      'turno-2026-10-01',
      'turno-2026-10-02',
      'turno-2026-10-03',
      'turno-2026-10-04',
      'turno-2026-10-05',
      'turno-2026-10-06',
    ]);
    expect(r[0]).toMatchObject({ at: at(1, 5), title: 'Mañana: entras a las 06:00', body: 'Hoy trabajas de 06:00 a 14:00.' });
    expect(r[4].body).toBe('Hoy trabajas de 22:00 a 06:00.');
  });

  it('sin aviso de turno si está apagado o ya ha pasado', () => {
    expect(planReminders(plan, [], NOW, { shiftLeadMinutes: null, concerts: false })).toEqual([]);
    const late = planReminders(plan, [], at(1, 5, 30), { shiftLeadMinutes: 60, concerts: false, days: 0 });
    expect(late).toEqual([]);
  });
});

describe('planReminders · conciertos', () => {
  const libre = makeConcert({ id: 'c1', artist: 'Los Invento', venue: 'Sala Ejemplo', startsAt: at(8, 21) });
  const trabajas = makeConcert({ id: 'c2', artist: 'Otra Banda', venue: 'Sala B', startsAt: at(3, 21) });
  const tras = makeConcert({ id: 'c3', artist: 'Tercera', venue: 'Sala C', startsAt: at(2, 21) });
  const pasado = makeConcert({ id: 'c4', startsAt: at(1, 0, 10) });

  it('el día antes a las 20:00, diciendo si ese día trabajas', () => {
    const r = planReminders(plan, [libre, trabajas, tras, pasado], NOW, { shiftLeadMinutes: null, concerts: true });
    const byId = Object.fromEntries(r.map((x) => [x.id, x]));
    expect(byId['concierto-c1']).toMatchObject({
      at: at(7, 20),
      title: 'Mañana: Los Invento',
      body: 'Sala Ejemplo · 21:00. Ese día libras.',
    });
    expect(byId['concierto-c2'].body).toBe('Sala B · 21:00. Ojo: ese día trabajas (14:00–22:00).');
    expect(byId['concierto-c3'].body).toBe('Sala C · 21:00. Ese día trabajas (06:00–14:00), pero te da tiempo.');
    expect(byId['concierto-c4']).toBeUndefined();
  });

  it('como mucho los más cercanos que caben en iOS, en orden', () => {
    const many = Array.from({ length: 80 }, (_, i) =>
      makeConcert({ id: `x${i}`, startsAt: at(2, 21) + i * 60_000 })
    );
    const r = planReminders(plan, many, NOW, { shiftLeadMinutes: 60, concerts: true });
    expect(r).toHaveLength(MAX_REMINDERS);
    expect(r.every((x, i) => i === 0 || r[i - 1].at <= x.at)).toBe(true);
  });
});
