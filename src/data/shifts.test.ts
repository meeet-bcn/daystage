import { describe, expect, it } from '@jest/globals';

import {
  addDays,
  availabilityFor,
  crossesMidnight,
  daysBetween,
  DEFAULT_SHIFT_TYPES,
  formatDay,
  formatMonth,
  freeWindows,
  isDateKey,
  isTime,
  monthGrid,
  Rotation,
  shiftForDate,
  shiftHours,
  shiftInterval,
  ShiftPlan,
  templateCycle,
  toDateKey,
  typeForDate,
  weekdayIndex,
} from '@/data/shifts';

// Los tests corren en Europe/Madrid (scripts/jest-timezone.js)
const at = (date: string, time: string) => new Date(`${date}T${time}:00`).getTime();
const HOUR = 3_600_000;

const [MORNING, AFTERNOON, NIGHT] = DEFAULT_SHIFT_TYPES;

// 2M-2T-2N-4L desde el jueves 1 de octubre de 2026
const ROTATION: Rotation = {
  id: 'r1',
  name: 'Rotación',
  startDate: '2026-10-01',
  cycle: templateCycle('manana', 'tarde', 'noche'),
};

const plan = (overrides: ShiftPlan['overrides'] = {}): ShiftPlan => ({
  types: DEFAULT_SHIFT_TYPES,
  rotation: ROTATION,
  overrides,
});

describe('zona horaria de los tests', () => {
  it('es Europe/Madrid', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Madrid');
  });
});

describe('fechas', () => {
  it('suma días cruzando meses, años y cambios de hora', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
  });

  it('cuenta días aunque un día dure 23 o 25 horas', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysBetween('2026-10-01', '2025-10-01')).toBe(-365);
  });

  it('la semana empieza en lunes', () => {
    expect(weekdayIndex('2026-10-26')).toBe(0); // lunes
    expect(weekdayIndex('2026-10-25')).toBe(6); // domingo
  });

  it('toDateKey usa el día local', () => {
    expect(toDateKey(new Date(2026, 9, 25, 23, 30))).toBe('2026-10-25');
    expect(toDateKey(new Date(2026, 2, 29, 0, 0))).toBe('2026-03-29');
  });

  it('valida fechas y horas', () => {
    expect(isDateKey('2026-02-29')).toBe(false);
    expect(isDateKey('2028-02-29')).toBe(true);
    expect(isDateKey('2026-1-01')).toBe(false);
    expect(isTime('06:00')).toBe(true);
    expect(isTime('24:00')).toBe(false);
    expect(isTime('6:00')).toBe(false);
  });

  it('formatea en español', () => {
    expect(formatDay('2026-10-27')).toBe('martes, 27 de octubre');
    expect(formatMonth(2026, 10)).toBe('Octubre 2026');
  });
});

describe('shiftForDate', () => {
  it('sigue la rotación 2M-2T-2N-4L', () => {
    const days = Array.from({ length: 11 }, (_, i) =>
      shiftForDate(addDays('2026-10-01', i), ROTATION),
    );
    expect(days).toEqual([
      'manana', 'manana', 'tarde', 'tarde', 'noche', 'noche', null, null, null, null, 'manana',
    ]);
  });

  it('antes del inicio, el ciclo sigue hacia atrás', () => {
    expect(shiftForDate('2026-09-30', ROTATION)).toBeNull(); // último libre
    expect(shiftForDate('2026-09-26', ROTATION)).toBe('noche');
    expect(shiftForDate('2026-09-21', ROTATION)).toBe('manana');
    expect(shiftForDate('2025-10-01', ROTATION)).toBe('noche'); // −365 ≡ 5
  });

  it('un cambio del día manda sobre la rotación', () => {
    const overrides = {
      '2026-10-08': { date: '2026-10-08', shiftTypeId: 'tarde' },
      '2026-10-01': { date: '2026-10-01', shiftTypeId: null, note: 'Vacaciones' },
    };
    expect(shiftForDate('2026-10-08', ROTATION, overrides)).toBe('tarde');
    expect(shiftForDate('2026-10-01', ROTATION, overrides)).toBeNull();
    expect(shiftForDate('2026-10-02', ROTATION, overrides)).toBe('manana');
  });

  it('sin rotación (o vacía) todo es libre, salvo los cambios', () => {
    expect(shiftForDate('2026-10-01', null)).toBeNull();
    expect(shiftForDate('2026-10-01', { ...ROTATION, cycle: [] })).toBeNull();
    expect(
      shiftForDate('2026-10-01', null, { '2026-10-01': { date: '2026-10-01', shiftTypeId: 'noche' } }),
    ).toBe('noche');
  });

  it('typeForDate ignora tipos que ya no existen', () => {
    expect(typeForDate('2026-10-01', plan())?.name).toBe('Mañana');
    expect(typeForDate('2026-10-01', { ...plan(), types: [AFTERNOON, NIGHT] })).toBeNull();
  });
});

describe('shiftInterval y shiftHours', () => {
  it('un turno de día empieza y acaba el mismo día', () => {
    expect(shiftInterval('2026-10-01', MORNING)).toEqual({
      start: at('2026-10-01', '06:00'),
      end: at('2026-10-01', '14:00'),
    });
    expect(crossesMidnight(MORNING)).toBe(false);
  });

  it('la noche acaba al día siguiente', () => {
    expect(crossesMidnight(NIGHT)).toBe(true);
    expect(shiftInterval('2026-10-05', NIGHT)).toEqual({
      start: at('2026-10-05', '22:00'),
      end: at('2026-10-06', '06:00'),
    });
  });

  it('cambio de hora: la noche de marzo dura 7 h y la de octubre, 9 h', () => {
    const march = shiftInterval('2026-03-28', NIGHT);
    expect(march.end - march.start).toBe(7 * HOUR);
    expect(march.end).toBe(at('2026-03-29', '06:00'));
    const october = shiftInterval('2026-10-24', NIGHT);
    expect(october.end - october.start).toBe(9 * HOUR);
    expect(october.end).toBe(at('2026-10-25', '06:00'));
  });

  it('horas según el horario, sin el descanso', () => {
    expect(shiftHours(MORNING)).toBe(8);
    expect(shiftHours(NIGHT)).toBe(8);
    expect(shiftHours({ ...MORNING, breakMinutes: 30 })).toBe(7.5);
    expect(shiftHours({ start: '08:00', end: '08:00', breakMinutes: 0 })).toBe(24);
  });
});

describe('freeWindows', () => {
  it('día de mañana: libre de madrugada y por la tarde', () => {
    expect(freeWindows('2026-10-01', plan())).toEqual([
      { start: at('2026-10-01', '00:00'), end: at('2026-10-01', '06:00') },
      { start: at('2026-10-01', '14:00'), end: at('2026-10-02', '00:00') },
    ]);
  });

  it('cuenta la noche anterior que acaba esta mañana', () => {
    // 6 de octubre: sales de la noche a las 6:00 y vuelves a entrar a las 22:00
    expect(freeWindows('2026-10-06', plan())).toEqual([
      { start: at('2026-10-06', '06:00'), end: at('2026-10-06', '22:00') },
    ]);
    // 7 de octubre: libre, pero la noche del 6 acaba a las 6:00
    expect(freeWindows('2026-10-07', plan())).toEqual([
      { start: at('2026-10-07', '06:00'), end: at('2026-10-08', '00:00') },
    ]);
  });

  it('un día libre entero dura lo que dure ese día (25 h al atrasar la hora)', () => {
    const plain = freeWindows('2026-10-08', plan());
    expect(plain).toHaveLength(1);
    expect(plain[0].end - plain[0].start).toBe(24 * HOUR);
    const dst = freeWindows('2026-10-25', { ...plan(), rotation: null });
    expect(dst[0].end - dst[0].start).toBe(25 * HOUR);
    const spring = freeWindows('2026-03-29', { ...plan(), rotation: null });
    expect(spring[0].end - spring[0].start).toBe(23 * HOUR);
  });

  it('noche que acaba el domingo del cambio de hora de octubre', () => {
    const p: ShiftPlan = {
      ...plan(),
      rotation: null,
      overrides: { '2026-10-24': { date: '2026-10-24', shiftTypeId: 'noche' } },
    };
    expect(freeWindows('2026-10-25', p)).toEqual([
      { start: at('2026-10-25', '06:00'), end: at('2026-10-26', '00:00') },
    ]);
  });
});

describe('availabilityFor', () => {
  it('libre: ese día no trabajas', () => {
    expect(availabilityFor(at('2026-10-08', '21:00'), plan())).toBe('libre');
    // La víspera de una mañana también: el concierto acaba antes
    expect(availabilityFor(at('2026-10-10', '21:00'), plan())).toBe('libre');
  });

  it('tras-turno: trabajas, pero acabas con margen', () => {
    expect(availabilityFor(at('2026-10-01', '21:00'), plan())).toBe('tras-turno');
    // Saliste de la noche esta mañana
    expect(availabilityFor(at('2026-10-07', '21:00'), plan())).toBe('tras-turno');
  });

  it('trabajas: el concierto cae en el turno', () => {
    expect(availabilityFor(at('2026-10-03', '21:00'), plan())).toBe('trabajas');
  });

  it('antes-turno: ese día trabajas más tarde, pero el concierto acaba antes', () => {
    // El 5 empieza la noche a las 22:00; un concierto a las 11:00 acaba a las 14:00
    expect(availabilityFor(at('2026-10-05', '11:00'), plan())).toBe('antes-turno');
    // Tras una mañana, la tarde del concierto ya cuenta como tras el turno
    expect(availabilityFor(at('2026-10-06', '12:00'), plan())).toBe('tras-turno');
  });

  it('trabajas: el turno de noche empieza antes de que acabe', () => {
    expect(availabilityFor(at('2026-10-05', '20:00'), plan())).toBe('trabajas');
  });

  it('el margen tras el turno se puede configurar', () => {
    // La tarde acaba a las 22:00
    expect(availabilityFor(at('2026-10-03', '22:30'), plan())).toBe('trabajas');
    expect(availabilityFor(at('2026-10-03', '22:30'), plan(), { marginMinutes: 15 })).toBe(
      'tras-turno',
    );
    expect(availabilityFor(at('2026-10-03', '23:00'), plan())).toBe('tras-turno');
  });

  it('respeta los cambios del día', () => {
    const vacation = { '2026-10-03': { date: '2026-10-03', shiftTypeId: null } };
    expect(availabilityFor(at('2026-10-03', '21:00'), plan(vacation))).toBe('libre');
    const extra = { '2026-10-08': { date: '2026-10-08', shiftTypeId: 'tarde' } };
    expect(availabilityFor(at('2026-10-08', '21:00'), plan(extra))).toBe('trabajas');
  });

  it('funciona el día del cambio de hora', () => {
    const p: ShiftPlan = {
      ...plan(),
      rotation: null,
      overrides: { '2026-10-25': { date: '2026-10-25', shiftTypeId: 'manana' } },
    };
    expect(availabilityFor(at('2026-10-25', '20:00'), p)).toBe('tras-turno');
    expect(availabilityFor(at('2026-10-25', '13:00'), p)).toBe('trabajas');
  });
});

describe('monthGrid', () => {
  it('octubre de 2026: 5 semanas, de lunes 28 de septiembre a domingo 1 de noviembre', () => {
    const grid = monthGrid(2026, 10);
    expect(grid).toHaveLength(5);
    expect(grid[0][0]).toEqual({ date: '2026-09-28', inMonth: false });
    expect(grid[0][3]).toEqual({ date: '2026-10-01', inMonth: true });
    expect(grid[4][6]).toEqual({ date: '2026-11-01', inMonth: false });
    expect(grid.flat().filter((d) => d.inMonth)).toHaveLength(31);
  });

  it('febrero de 2027 empieza en lunes: 4 semanas justas', () => {
    const grid = monthGrid(2027, 2);
    expect(grid).toHaveLength(4);
    expect(grid[0][0].date).toBe('2027-02-01');
    expect(grid.flat().every((d) => d.inMonth)).toBe(true);
  });

  it('marzo de 2026 empieza en domingo: 6 semanas', () => {
    const grid = monthGrid(2026, 3);
    expect(grid).toHaveLength(6);
    expect(grid[0][6]).toEqual({ date: '2026-03-01', inMonth: true });
    expect(grid.every((week) => week.length === 7)).toBe(true);
  });
});
