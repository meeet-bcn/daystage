import { describe, expect, it } from '@jest/globals';

import { makeConcert } from '@/data/__fixtures__/concert';
import { companionsLabel, isPast, splitPlans } from '@/data/plans';

// Miércoles 21 de octubre de 2026, 12:00
const NOW = new Date(2026, 9, 21, 12, 0);
const at = (day: number, hour = 21) => new Date(2026, 9, day, hour, 0).getTime();

describe('isPast', () => {
  it('un concierto de hoy sigue siendo un plan, aunque ya haya empezado', () => {
    expect(isPast(makeConcert({ startsAt: at(21, 9) }), NOW)).toBe(false);
    expect(isPast(makeConcert({ startsAt: at(21, 23) }), NOW)).toBe(false);
  });

  it('pasa a "ya fui" al día siguiente', () => {
    expect(isPast(makeConcert({ startsAt: at(20, 23) }), NOW)).toBe(true);
  });

  it('sin fecha nunca es pasado', () => {
    expect(isPast(makeConcert({ startsAt: null }), NOW)).toBe(false);
  });
});

describe('splitPlans', () => {
  it('próximos del más cercano al más lejano y pasados del más reciente al más antiguo', () => {
    const plans = [
      makeConcert({ id: 'pasado-viejo', startsAt: at(2) }),
      makeConcert({ id: 'lejano', startsAt: at(30) }),
      makeConcert({ id: 'sin-fecha', startsAt: null }),
      makeConcert({ id: 'hoy', startsAt: at(21) }),
      makeConcert({ id: 'pasado-reciente', startsAt: at(18) }),
    ];
    const { upcoming, past } = splitPlans(plans, NOW);
    expect(upcoming.map((c) => c.id)).toEqual(['hoy', 'lejano', 'sin-fecha']);
    expect(past.map((c) => c.id)).toEqual(['pasado-reciente', 'pasado-viejo']);
  });

  it('no modifica la lista original', () => {
    const plans = [makeConcert({ id: 'b', startsAt: at(30) }), makeConcert({ id: 'a', startsAt: at(22) })];
    splitPlans(plans, NOW);
    expect(plans.map((c) => c.id)).toEqual(['b', 'a']);
  });
});

describe('companionsLabel', () => {
  it.each([
    [0, false, 'Aún nadie más'],
    [1, false, '1 persona va contigo'],
    [3, false, '3 personas van contigo'],
    [0, true, 'Fuiste'],
    [1, true, '1 persona fue contigo'],
    [5, true, '5 personas fueron contigo'],
  ])('%i, pasado=%s → "%s"', (others, past, expected) => {
    expect(companionsLabel(others, past)).toBe(expected);
  });
});
