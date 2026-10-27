import { describe, expect, it } from '@jest/globals';

import { makeConcert } from '@/data/__fixtures__/concert';
import {
  AVAILABILITY_LABELS,
  canGo,
  concertAvailability,
  concertsByDate,
  effectiveStart,
  plansInMonth,
  hasSchedule,
} from '@/data/concert-shifts';
import { DEFAULT_SHIFT_TYPES, EMPTY_PLAN, type ShiftPlan, templateCycle } from '@/data/shifts';

// Europe/Madrid (scripts/jest-timezone.js). 2M-2T-2N-4L desde el 1 de octubre de 2026
const PLAN: ShiftPlan = {
  types: DEFAULT_SHIFT_TYPES,
  rotation: {
    id: 'r1',
    name: 'Rotación',
    startDate: '2026-10-01',
    cycle: templateCycle('manana', 'tarde', 'noche'),
  },
  overrides: {},
};
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).getTime();

describe('concertAvailability', () => {
  it('libre, tras el turno o trabajas', () => {
    expect(concertAvailability({ startsAt: at(8, 21) }, PLAN)).toBe('libre');
    expect(concertAvailability({ startsAt: at(1, 21) }, PLAN)).toBe('tras-turno');
    expect(concertAvailability({ startsAt: at(3, 21) }, PLAN)).toBe('trabajas');
  });

  it('usa el margen de Ajustes', () => {
    // La tarde del 3 acaba a las 22:00
    expect(concertAvailability({ startsAt: at(3, 22, 45) }, PLAN, 60)).toBe('trabajas');
    expect(concertAvailability({ startsAt: at(3, 22, 45) }, PLAN, 30)).toBe('tras-turno');
  });

  it('sin hora (00:00 de las fuentes) se supone la noche de ese día', () => {
    // El 5 empieza la noche a las 22:00: a las 00:00 estaría libre, a las 21:00 no
    expect(concertAvailability({ startsAt: at(5, 0) }, PLAN)).toBe('trabajas');
    expect(effectiveStart(at(5, 0))).toBe(at(5, 21));
    expect(effectiveStart(at(5, 0, 30))).toBe(at(5, 0, 30));
  });

  it('sin fecha o sin turnos configurados, nada', () => {
    expect(concertAvailability({ startsAt: null }, PLAN)).toBeNull();
    expect(concertAvailability({ startsAt: at(8, 21) }, EMPTY_PLAN)).toBeNull();
    expect(
      concertAvailability({ startsAt: at(8, 21) }, { ...PLAN, rotation: { ...PLAN.rotation!, cycle: [] } }),
    ).toBeNull();
  });

  it('sin rotación pero con un día cambiado, cuenta ese cambio', () => {
    const plan: ShiftPlan = {
      ...EMPTY_PLAN,
      types: DEFAULT_SHIFT_TYPES,
      overrides: { '2026-10-08': { date: '2026-10-08', shiftTypeId: 'tarde' } },
    };
    expect(hasSchedule(plan)).toBe(true);
    expect(concertAvailability({ startsAt: at(8, 21) }, plan)).toBe('trabajas');
    expect(concertAvailability({ startsAt: at(9, 21) }, plan)).toBe('libre');
  });
});

describe('canGo y textos', () => {
  it('libre, antes o tras el turno se puede; trabajando o sin datos, no', () => {
    expect(canGo('libre')).toBe(true);
    expect(canGo('tras-turno')).toBe(true);
    expect(canGo('antes-turno')).toBe(true);
    expect(canGo('trabajas')).toBe(false);
    expect(canGo(null)).toBe(false);
  });

  it('pastillas en español', () => {
    expect(AVAILABILITY_LABELS).toEqual({
      libre: 'Día libre',
      'tras-turno': 'Tras tu turno',
      'antes-turno': 'Antes de tu turno',
      trabajas: 'Trabajas',
    });
  });
});

describe('concertsByDate', () => {
  it('agrupa por día local y ordena por hora; sin fecha, fuera', () => {
    const late = makeConcert({ id: 'late', startsAt: at(8, 23, 30) });
    const early = makeConcert({ id: 'early', startsAt: at(8, 19) });
    const other = makeConcert({ id: 'other', startsAt: at(9, 0, 30) });
    const tbc = makeConcert({ id: 'tbc', startsAt: null });
    const byDate = concertsByDate([late, other, tbc, early]);
    expect(Object.keys(byDate).sort()).toEqual(['2026-10-08', '2026-10-09']);
    expect(byDate['2026-10-08'].map((c) => c.id)).toEqual(['early', 'late']);
    expect(byDate['2026-10-09'].map((c) => c.id)).toEqual(['other']);
  });
});

describe('plansInMonth', () => {
  it('los planes del mes por fecha y hora, también los pasados; sin fecha, fuera', () => {
    const past = makeConcert({ id: 'past', startsAt: new Date(2026, 9, 2, 21).getTime() });
    const late = makeConcert({ id: 'late', startsAt: at(31, 23) });
    const early = makeConcert({ id: 'early', startsAt: at(31, 18) });
    const november = makeConcert({ id: 'nov', startsAt: new Date(2026, 10, 1, 21).getTime() });
    const tbc = makeConcert({ id: 'tbc', startsAt: null });
    const plans = [november, late, tbc, past, early];
    expect(plansInMonth(plans, 2026, 10).map((c) => c.id)).toEqual(['past', 'early', 'late']);
    expect(plansInMonth(plans, 2026, 11).map((c) => c.id)).toEqual(['nov']);
    expect(plansInMonth([], 2026, 10)).toEqual([]);
  });
});
