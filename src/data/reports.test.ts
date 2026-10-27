import { describe, expect, it } from '@jest/globals';

import { formatEuros, formatHours, monthReport, shiftKind, weekLabel } from '@/data/reports';
import type { ShiftPlan, ShiftType } from '@/data/shifts';

// Datos inventados
const M: ShiftType = { id: 'm', name: 'Mañana', abbr: 'M', color: 'verde', start: '08:00', end: '16:30', breakMinutes: 30 };
const T: ShiftType = { id: 't', name: 'Tarde', abbr: 'T', color: 'rojo', start: '14:00', end: '22:00', breakMinutes: 0 };
const N: ShiftType = { id: 'n', name: 'Noche', abbr: 'N', color: 'indigo', start: '22:00', end: '07:00', breakMinutes: 0 };
const V: ShiftType = { id: 'v', name: 'Vacaciones', abbr: 'VAC', color: 'sol', start: '00:00', end: '00:00', breakMinutes: 0, off: true };

// Febrero de 2027: empieza en lunes y tiene 4 semanas justas
const plan: ShiftPlan = {
  types: [M, T, N, V],
  rotation: null,
  overrides: {
    '2027-02-01': { date: '2027-02-01', shiftTypeId: 'm' }, // 8 h
    '2027-02-02': { date: '2027-02-02', shiftTypeId: 'm' }, // 8 h
    '2027-02-03': { date: '2027-02-03', shiftTypeId: 't' }, // 8 h
    '2027-02-09': { date: '2027-02-09', shiftTypeId: 'n' }, // 9 h → 1 extra
    '2027-02-15': { date: '2027-02-15', shiftTypeId: 'v' },
    '2027-02-16': { date: '2027-02-16', shiftTypeId: 'v' },
    '2027-03-01': { date: '2027-03-01', shiftTypeId: 'm' }, // fuera del mes
  },
};

describe('shiftKind', () => {
  it('mañana, tarde o noche', () => {
    expect(shiftKind(M)).toBe('manana');
    expect(shiftKind({ start: '10:00', end: '19:00' })).toBe('manana');
    expect(shiftKind(T)).toBe('tarde');
    expect(shiftKind(N)).toBe('noche');
  });
});

describe('monthReport', () => {
  it('horas, tipos de día, extra y semanas del mes', () => {
    const r = monthReport(plan, 2027, 2, { dailyHours: 8, hourlyRate: null });
    expect(r).toMatchObject({
      workDays: 4,
      hours: 33,
      mornings: 2,
      afternoons: 1,
      nights: 1,
      vacationDays: 2,
      freeDays: 22,
      overtime: 1,
      earnings: null,
    });
    expect(r.weeks).toEqual([
      { start: '2027-02-01', hours: 24 },
      { start: '2027-02-08', hours: 9 },
      { start: '2027-02-15', hours: 0 },
      { start: '2027-02-22', hours: 0 },
    ]);
  });

  it('ganancias con tarifa y extra con otra jornada', () => {
    const r = monthReport(plan, 2027, 2, { dailyHours: 7.5, hourlyRate: 12.5 });
    expect(r.earnings).toBe(412.5);
    expect(r.overtime).toBe(3); // 0,5 × 3 + 1,5
  });

  it('las semanas que empiezan en el mes anterior solo cuentan los días del mes', () => {
    const p: ShiftPlan = { ...plan, overrides: { '2026-12-31': { date: '2026-12-31', shiftTypeId: 'm' }, '2027-01-01': { date: '2027-01-01', shiftTypeId: 't' } } };
    const r = monthReport(p, 2027, 1, { dailyHours: 8, hourlyRate: null });
    expect(r.weeks[0]).toEqual({ start: '2026-12-28', hours: 8 });
    expect(r.hours).toBe(8);
  });
});

describe('formatos', () => {
  it('horas, euros y semanas en español', () => {
    expect(formatHours(37.5)).toBe('37,5 h');
    expect(formatHours(8)).toBe('8 h');
    expect(formatEuros(1234.5)).toBe('1.234,50 €');
    expect(formatEuros(0)).toBe('0,00 €');
    expect(weekLabel('2026-10-26')).toBe('26 oct');
  });
});
