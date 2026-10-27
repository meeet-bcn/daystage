import { describe, expect, it } from '@jest/globals';

import { planFromJson, syncDecision } from '@/data/shift-sync';
import { DEFAULT_SHIFT_TYPES, type ShiftPlan, templateCycle } from '@/data/shifts';

describe('syncDecision', () => {
  it('gana el último cambio', () => {
    expect(syncDecision(200, 100)).toBe('push');
    expect(syncDecision(100, 200)).toBe('pull');
    expect(syncDecision(100, 100)).toBe('none');
  });

  it('sin copia en la cuenta se sube; con copia y nada en el móvil, se baja', () => {
    expect(syncDecision(100, null)).toBe('push');
    expect(syncDecision(null, 100)).toBe('pull');
    expect(syncDecision(null, null)).toBe('none');
  });
});

describe('planFromJson', () => {
  const plan: ShiftPlan = {
    types: [...DEFAULT_SHIFT_TYPES, { id: 'vac', name: 'Vacaciones', abbr: 'VAC', color: 'sol', start: '00:00', end: '00:00', breakMinutes: 0, off: true }],
    rotation: { id: 'r', name: 'Mi rotación', startDate: '2033-01-03', cycle: templateCycle('manana', 'tarde', 'noche') },
    overrides: { '2033-01-05': { date: '2033-01-05', shiftTypeId: 'vac', note: 'Viaje' } },
  };

  it('ida y vuelta por JSON sin perder nada', () => {
    expect(planFromJson(JSON.parse(JSON.stringify(plan)))).toEqual(plan);
  });

  it('descarta lo que no encaja sin romper', () => {
    const broken = {
      types: [
        DEFAULT_SHIFT_TYPES[0],
        { id: 'x', name: 'Mal', abbr: 'X', start: '25:00', end: '10:00' },
        { id: 'y', name: 'Color raro', abbr: 'Y', color: '#FF0000', start: '09:00', end: '17:00' },
        'basura',
      ],
      rotation: { id: 'r', startDate: '2033-02-30', cycle: [] },
      overrides: { 'no-es-fecha': {}, '2033-01-05': { shiftTypeId: 'borrado' } },
    };
    const clean = planFromJson(broken)!;
    expect(clean.types.map((t) => t.id)).toEqual(['manana', 'y']);
    expect(clean.types[1].color).toBe('cielo');
    expect(clean.rotation).toBeNull();
    expect(clean.overrides).toEqual({ '2033-01-05': { date: '2033-01-05', shiftTypeId: null } });
    expect(planFromJson(null)).toBeNull();
    expect(planFromJson('hola')).toBeNull();
  });
});
