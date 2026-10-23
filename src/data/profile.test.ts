import { describe, expect, it } from '@jest/globals';

import { nickError, normalizeNick } from '@/data/profile';

describe('normalizeNick', () => {
  it.each([
    ['@Jordi', 'jordi'],
    ['  jordi.bcn  ', 'jordi.bcn'],
    ['@@jordi', 'jordi'],
    ['jordi bcn', 'jordibcn'],
    ['', ''],
  ])('"%s" → "%s"', (input, expected) => {
    expect(normalizeNick(input)).toBe(expected);
  });
});

describe('nickError', () => {
  it('acepta nicks válidos y el vacío (es opcional)', () => {
    for (const nick of ['', 'jordi', 'jordi.bcn', 'jordi_23', 'abc', 'a'.repeat(30)]) {
      expect(nickError(nick)).toBeNull();
    }
  });

  it.each([
    ['jo', 'Mínimo 3 caracteres.'],
    ['a'.repeat(31), 'Máximo 30 caracteres.'],
    ['jordí', 'Solo letras sin acentos, números, "." y "_".'],
    ['jordi-bcn', 'Solo letras sin acentos, números, "." y "_".'],
    ['.jordi', 'No puede empezar ni acabar en punto.'],
    ['jordi.', 'No puede empezar ni acabar en punto.'],
    ['jor..di', 'No puede tener dos puntos seguidos.'],
  ])('"%s" → %s', (nick, error) => {
    expect(nickError(nick)).toBe(error);
  });
});
