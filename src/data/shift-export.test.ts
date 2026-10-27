import { describe, expect, it } from '@jest/globals';

import { monthReport } from '@/data/reports';
import { calendarEvents, EVENT_MARK, monthHtml } from '@/data/shift-export';
import type { ShiftPlan, ShiftType } from '@/data/shifts';

// Datos inventados
const M: ShiftType = { id: 'm', name: 'Mañana', abbr: 'M', color: 'verde', start: '08:45', end: '17:45', breakMinutes: 0 };
const N: ShiftType = { id: 'n', name: 'Noche', abbr: 'N', color: 'indigo', start: '22:00', end: '06:00', breakMinutes: 0 };
const V: ShiftType = { id: 'v', name: 'Vacaciones', abbr: 'VAC', color: 'sol', start: '00:00', end: '00:00', breakMinutes: 0, off: true };
const plan: ShiftPlan = {
  types: [M, N, V],
  rotation: null,
  overrides: {
    '2033-03-01': { date: '2033-03-01', shiftTypeId: 'm' },
    '2033-03-02': { date: '2033-03-02', shiftTypeId: 'n' },
    '2033-03-03': { date: '2033-03-03', shiftTypeId: 'v' },
  },
};

describe('calendarEvents', () => {
  it('un evento por turno (con su hora real) y las vacaciones de día entero; libres, nada', () => {
    const events = calendarEvents(plan, '2033-03-01', 5);
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({
      title: 'Turno: Mañana',
      startDate: new Date(2033, 2, 1, 8, 45),
      endDate: new Date(2033, 2, 1, 17, 45),
      allDay: false,
      notes: EVENT_MARK,
    });
    expect(events[1].endDate).toEqual(new Date(2033, 2, 3, 6, 0)); // la noche acaba al día siguiente
    expect(events[2]).toMatchObject({
      title: 'Vacaciones',
      allDay: true,
      startDate: new Date(2033, 2, 3),
      endDate: new Date(2033, 2, 4),
    });
  });
});

describe('monthHtml', () => {
  it('el mes con horas y colores, y el resumen', () => {
    const report = monthReport(plan, 2033, 3, { dailyHours: 8, hourlyRate: 10 });
    const html = monthHtml(plan, 2033, 3, report);
    expect(html).toContain('<h1>Marzo 2033</h1>');
    expect(html).toContain('<b>8:45</b><br><small>17:45</small>');
    expect(html).toContain('<b>VAC</b>');
    expect(html).toContain('17 h'); // 9 + 8
    expect(html).toContain('170,00 €');
    expect(html.match(/<td/g)?.length).toBeGreaterThanOrEqual(31);
  });

  it('escapa los nombres', () => {
    const weird: ShiftPlan = {
      types: [{ ...V, abbr: '<b>' }],
      rotation: null,
      overrides: { '2033-03-01': { date: '2033-03-01', shiftTypeId: 'v' } },
    };
    const html = monthHtml(weird, 2033, 3, monthReport(weird, 2033, 3, { dailyHours: 8, hourlyRate: null }));
    expect(html).toContain('&lt;b&gt;');
  });
});
