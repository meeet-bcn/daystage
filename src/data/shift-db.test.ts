import { describe, expect, it, jest } from '@jest/globals';

import { planFromRows } from '@/data/shift-db';

// Solo se prueba el montaje del plan: SQLite no existe en los tests (jest sube el mock arriba)
jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));

describe('planFromRows', () => {
  it('monta tipos, rotación en orden y cambios por fecha', () => {
    const plan = planFromRows(
      [
        {
          id: 'noche',
          name: 'Noche',
          abbr: 'N',
          color: 'indigo',
          start_time: '22:00',
          end_time: '06:00',
          break_minutes: 30,
        },
      ],
      { id: 'r1', name: 'Rotación', start_date: '2026-10-01' },
      [
        { position: 2, shift_type_id: null },
        { position: 0, shift_type_id: 'noche' },
        { position: 1, shift_type_id: 'noche' },
      ],
      [
        { date: '2026-10-08', shift_type_id: null, note: 'Vacaciones' },
        { date: '2026-10-09', shift_type_id: 'noche', note: null },
      ],
    );
    expect(plan.types[0]).toEqual({
      id: 'noche',
      name: 'Noche',
      abbr: 'N',
      color: 'indigo',
      start: '22:00',
      end: '06:00',
      breakMinutes: 30,
    });
    expect(plan.rotation).toEqual({
      id: 'r1',
      name: 'Rotación',
      startDate: '2026-10-01',
      cycle: ['noche', 'noche', null],
    });
    expect(plan.overrides).toEqual({
      '2026-10-08': { date: '2026-10-08', shiftTypeId: null, note: 'Vacaciones' },
      '2026-10-09': { date: '2026-10-09', shiftTypeId: 'noche' },
    });
  });

  it('sin rotación', () => {
    expect(planFromRows([], null, [], [])).toEqual({ types: [], rotation: null, overrides: {} });
  });
});
