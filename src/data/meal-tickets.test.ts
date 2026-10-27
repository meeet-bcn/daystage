import { describe, expect, it } from '@jest/globals';

import { mealTickets, mealTicketsLabel } from '@/data/meal-tickets';
import type { ShiftPlan, ShiftType } from '@/data/shifts';

// Datos inventados
const LARGO: ShiftType = { id: 'l', name: 'Largo', abbr: 'L', color: 'verde', start: '08:00', end: '17:00', breakMinutes: 60 };
const CORTO: ShiftType = { id: 'c', name: 'Corto', abbr: 'C', color: 'rojo', start: '16:00', end: '21:00', breakMinutes: 0 };
const NOCHE: ShiftType = { id: 'n', name: 'Noche', abbr: 'N', color: 'indigo', start: '22:00', end: '06:00', breakMinutes: 0 };
const VAC: ShiftType = { id: 'v', name: 'Vacaciones', abbr: 'VAC', color: 'sol', start: '00:00', end: '00:00', breakMinutes: 0, off: true };

const plan = (overrides: Record<string, string | null>, rotation: ShiftPlan['rotation'] = null): ShiftPlan => ({
  types: [LARGO, CORTO, NOCHE, VAC],
  rotation,
  overrides: Object.fromEntries(
    Object.entries(overrides).map(([date, shiftTypeId]) => [date, { date, shiftTypeId }])
  ),
});

describe('mealTickets', () => {
  it('cuenta los días que llegan al mínimo con las horas computadas (sin el descanso)', () => {
    const p = plan({ '2026-11-02': 'l', '2026-11-03': 'c', '2026-11-04': 'n' });
    // Largo: 9 h − 1 h de descanso = 8 h; Corto: 5 h; Noche: 8 h
    expect(mealTickets(p, 2026, 11, { minHours: 8, amount: 9.5 })).toEqual({ count: 2, amount: 9.5, total: 19 });
    expect(mealTickets(p, 2026, 11, { minHours: 8.5, amount: 9.5 }).count).toBe(0);
    expect(mealTickets(p, 2026, 11, { minHours: 5, amount: 9.5 }).count).toBe(3);
  });

  it('vacaciones y días libres no cuentan', () => {
    const p = plan({ '2026-11-02': 'v', '2026-11-03': null, '2026-11-04': 'l' });
    expect(mealTickets(p, 2026, 11, { minHours: 6, amount: 10 }).count).toBe(1);
  });

  it('un cambio del día manda sobre la rotación', () => {
    const rotation = { id: 'r', name: 'R', startDate: '2026-11-01', cycle: ['l'] };
    const p = plan({ '2026-11-10': null, '2026-11-11': 'c' }, rotation);
    // 30 días de noviembre con Largo, menos un libre y un corto
    expect(mealTickets(p, 2026, 11, { minHours: 6, amount: 1 }).count).toBe(28);
  });

  it('solo cuenta los días del mes (no los de las semanas que asoman)', () => {
    const p = plan({ '2026-10-31': 'l', '2026-11-30': 'l', '2026-12-01': 'l' });
    expect(mealTickets(p, 2026, 11, { minHours: 6, amount: 1 }).count).toBe(1);
  });

  it('redondea el total a céntimos', () => {
    const rotation = { id: 'r', name: 'R', startDate: '2026-11-01', cycle: ['l', 'l', null] };
    const t = mealTickets(plan({}, rotation), 2026, 11, { minHours: 6, amount: 9.33 });
    expect(t.count).toBe(20);
    expect(t.total).toBe(186.6);
  });
});

describe('mealTicketsLabel', () => {
  it('con euros en formato es-ES', () => {
    expect(mealTicketsLabel({ count: 14, amount: 9.5, total: 133 })).toBe('Ticket comida: 14 × 9,50 € = 133,00 €');
    expect(mealTicketsLabel({ count: 150, amount: 9.5, total: 1425 })).toBe('Ticket comida: 150 × 9,50 € = 1.425,00 €');
  });
});
