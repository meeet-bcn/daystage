import { describe, expect, it } from '@jest/globals';

import { ChatMessage, dayLabel, withDaySeparators } from '@/data/chat';

const NOW = new Date(2026, 9, 24, 20, 0).getTime();
const at = (day: number, hour = 12) => new Date(2026, 9, day, hour).getTime();
const msg = (id: string, sentAt: number): ChatMessage => ({ id, sentAt, text: id });

describe('dayLabel', () => {
  it('Hoy, Ayer o la fecha', () => {
    expect(dayLabel(at(24, 9), NOW)).toBe('Hoy');
    expect(dayLabel(at(23, 23), NOW)).toBe('Ayer');
    expect(dayLabel(at(20), NOW)).toBe('Martes, 20 de octubre');
  });
});

describe('withDaySeparators', () => {
  it('un separador antes del primer mensaje de cada día, en orden', () => {
    const rows = withDaySeparators(
      [msg('c', at(24, 10)), msg('a', at(23, 9)), msg('b', at(23, 18))],
      NOW
    );
    expect(rows.map((r) => (r.kind === 'day' ? r.label : r.id))).toEqual([
      'Ayer',
      'a',
      'b',
      'Hoy',
      'c',
    ]);
  });
});
