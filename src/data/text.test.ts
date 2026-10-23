import { describe, expect, it } from '@jest/globals';

import { compactText, foldText, headlinerName } from '@/data/text';

describe('headlinerName', () => {
  it.each([
    ['Fontaines D.C. - D.C. EU TOUR 2026', 'Fontaines D.C.'],
    ['Niall Horan: Dinner Party Live On Tour', 'Niall Horan'],
    ['Romanthica + Lex Lüger', 'Romanthica'],
    ['Michael Schenker MSG feat Robin Mcauley', 'Michael Schenker MSG'],
    ['20/20 · Power Pop Icons', '20/20'],
    ['Digitalism (Live)', 'Digitalism'],
    ['Kid Francescoli (DJ Set) - Gira 2026', 'Kid Francescoli'],
    ['Pete & Bas', 'Pete & Bas'], // "&" forma parte del nombre
    ['Simple Plan', 'Simple Plan'],
  ])('%s → %s', (name, expected) => {
    expect(headlinerName(name)).toBe(expected);
  });
});

describe('foldText / compactText', () => {
  it('quita acentos y mayúsculas; compactText además signos y espacios', () => {
    expect(foldText('Ánimo Bóveda Ruïn')).toBe('animo boveda ruin');
    expect(compactText('Fontaines D.C.')).toBe('fontainesdc');
    expect(compactText('FONTAINES DC')).toBe('fontainesdc');
  });
});
