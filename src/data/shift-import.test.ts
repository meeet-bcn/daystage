import { describe, expect, it } from '@jest/globals';

import {
  buildImport,
  classifyShift,
  importTypeId,
  parseShiftList,
  VACATION_TYPE_ID,
} from '@/data/shift-import';

// Datos inventados (nunca los turnos reales de nadie: el repo es público)
const SAMPLE = `
330301=7:30-15:30 330302=7:30-15:30, 330303=14:00-22:00
330304=V
330305=vacaciones 330306=13:00-19:00
`;

describe('parseShiftList', () => {
  it('lee fechas AAMMDD, horarios y vacaciones, separados por espacios, comas o líneas', () => {
    const { entries, errors } = parseShiftList(SAMPLE);
    expect(errors).toEqual([]);
    expect(entries).toEqual([
      { date: '2033-03-01', kind: 'work', start: '07:30', end: '15:30' },
      { date: '2033-03-02', kind: 'work', start: '07:30', end: '15:30' },
      { date: '2033-03-03', kind: 'work', start: '14:00', end: '22:00' },
      { date: '2033-03-04', kind: 'off' },
      { date: '2033-03-05', kind: 'off' },
      { date: '2033-03-06', kind: 'work', start: '13:00', end: '19:00' },
    ]);
  });

  it('avisa de lo que no entiende y sigue con lo demás', () => {
    const { entries, errors } = parseShiftList('330230=V hola 330301=25:00-26:00 330302=9:00-17:00');
    expect(entries).toEqual([{ date: '2033-03-02', kind: 'work', start: '09:00', end: '17:00' }]);
    expect(errors).toHaveLength(3); // 30 de febrero, "hola" y la hora imposible
  });

  it('si un día sale dos veces, vale el último', () => {
    expect(parseShiftList('330301=V 330301=9:00-17:00').entries).toEqual([
      { date: '2033-03-01', kind: 'work', start: '09:00', end: '17:00' },
    ]);
  });
});

describe('classifyShift', () => {
  it('mañana si acaba a las 19:00 o antes; si no, tarde', () => {
    expect(classifyShift('08:00', '14:00')).toBe('manana');
    expect(classifyShift('10:00', '19:00')).toBe('manana');
    expect(classifyShift('13:00', '19:00')).toBe('manana');
    expect(classifyShift('11:00', '20:00')).toBe('tarde');
    expect(classifyShift('16:15', '22:15')).toBe('tarde');
    expect(classifyShift('22:00', '06:00')).toBe('tarde'); // acaba al día siguiente
  });
});

describe('descanso de las jornadas de 9 h', () => {
  it('1 h que no computa en las de 9 h; ninguno en las demás', () => {
    const { newTypes } = buildImport(parseShiftList('330301=8:45-17:45 330302=12:00-21:00 330303=8:00-14:00 330304=13:15-22:15').entries, []);
    const byName = Object.fromEntries(newTypes.map((t) => [t.name, t.breakMinutes]));
    expect(byName).toEqual({
      'Mañana 08:00–14:00': 0,
      'Mañana 08:45–17:45': 60,
      'Tarde 12:00–21:00': 60,
      'Tarde 13:15–22:15': 60,
    });
  });
});

describe('buildImport', () => {
  const { entries } = parseShiftList(SAMPLE);

  it('un tipo por horario (verde de mañana, rojo de tarde) y Vacaciones, sin repetir', () => {
    const { newTypes, overrides } = buildImport(entries, []);
    expect(newTypes.map((t) => [t.name, t.abbr, t.color, !!t.off])).toEqual([
      ['Mañana 07:30–15:30', 'M', 'verde', false],
      ['Mañana 13:00–19:00', 'M', 'verde', false],
      ['Tarde 14:00–22:00', 'T', 'rojo', false],
      ['Vacaciones', 'VAC', 'sol', true],
    ]);
    expect(overrides).toHaveLength(6);
    expect(overrides[0]).toEqual({ date: '2033-03-01', shiftTypeId: importTypeId('07:30', '15:30') });
    expect(overrides[3]).toEqual({ date: '2033-03-04', shiftTypeId: VACATION_TYPE_ID });
  });

  it('importar otra vez no duplica los tipos que ya existen', () => {
    const first = buildImport(entries, []);
    const again = buildImport(entries, first.newTypes);
    expect(again.newTypes).toEqual([]);
    expect(again.overrides).toEqual(first.overrides);
  });
});
