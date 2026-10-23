import { describe, expect, it } from '@jest/globals';

import {
  handleError,
  nickError,
  normalizeHandle,
  normalizeNick,
  SOCIAL_NETWORKS,
} from '@/data/profile';

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

describe('normalizeHandle', () => {
  it.each([
    ['@Jordi', 'jordi'],
    ['  jordi.bcn ', 'jordi.bcn'],
    ['https://www.instagram.com/jordi.bcn/', 'jordi.bcn'],
    ['instagram.com/jordi?igsh=abc', 'jordi'],
    ['https://www.tiktok.com/@jordi_23', 'jordi_23'],
    ['https://x.com/Jordi', 'jordi'],
    ['https://twitter.com/jordi', 'jordi'],
    ['', ''],
  ])('"%s" → "%s"', (input, expected) => {
    expect(normalizeHandle(input)).toBe(expected);
  });
});

describe('handleError', () => {
  it('acepta usuarios válidos y el vacío', () => {
    expect(handleError('instagram', '')).toBeNull();
    expect(handleError('instagram', 'jordi.bcn')).toBeNull();
    expect(handleError('tiktok', 'jordi_23')).toBeNull();
    expect(handleError('x', 'jordi_23')).toBeNull();
  });

  it('aplica las reglas de cada red', () => {
    expect(handleError('x', 'jordi.bcn')).toBe('Solo letras sin acentos, números y "_".');
    expect(handleError('x', 'a'.repeat(16))).toBe('Máximo 15 caracteres.');
    expect(handleError('tiktok', 'a'.repeat(25))).toBe('Máximo 24 caracteres.');
    expect(handleError('instagram', 'jordí')).toBe('Solo letras sin acentos, números, "." y "_".');
  });
});

describe('SOCIAL_NETWORKS', () => {
  it('construye el enlace del perfil público', () => {
    expect(SOCIAL_NETWORKS.instagram.url('jordi')).toBe('https://www.instagram.com/jordi');
    expect(SOCIAL_NETWORKS.tiktok.url('jordi')).toBe('https://www.tiktok.com/@jordi');
    expect(SOCIAL_NETWORKS.x.url('jordi')).toBe('https://x.com/jordi');
  });
});
