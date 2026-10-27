import { describe, expect, it } from '@jest/globals';

import {
  COLORS,
  PROFILE_BACKGROUNDS,
  ProfileBackground,
  SHIFT_COLORS,
  ShiftColor,
  shiftColor,
  themeFor,
  tint,
} from '@/theme';

// Contraste WCAG entre un color y el blanco
function contrastOnWhite(hex: string) {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  return 1.05 / (luminance + 0.05);
}

describe('themeFor', () => {
  it('sin fondo y Aurora usan el violeta de la marca', () => {
    expect(themeFor('none')).toMatchObject({
      accent: COLORS.accent,
      accentSoft: COLORS.accentSoft,
    });
    expect(themeFor('aurora').accent).toBe(COLORS.accent);
  });

  it.each(Object.keys(PROFILE_BACKGROUNDS) as ProfileBackground[])(
    '%s: el acento se lee sobre blanco (al menos 3:1)',
    (key) => {
      expect(contrastOnWhite(themeFor(key).accent)).toBeGreaterThanOrEqual(3);
    }
  );
});

describe('tint', () => {
  it('mezcla con blanco', () => {
    expect(tint('#DD6B1F', 0)).toBe('#DD6B1F');
    expect(tint('#DD6B1F', 1)).toBe('#FFFFFF');
    expect(tint('#000000', 0.5)).toBe('#808080');
  });
});

describe('logo de Inicio', () => {
  it('sin fondo, las "eee" van en el salmón de la marca', () => {
    expect(themeFor('none').logo).toEqual([COLORS.peach, COLORS.peachMid, COLORS.peachDeep]);
  });

  it('con fondo, de claro a oscuro hasta su acento', () => {
    const { logo, accent } = themeFor('mandarina');
    expect(logo[2]).toBe(accent);
    const light = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16);
    expect(light(logo[0])).toBeGreaterThan(light(logo[1]));
    expect(light(logo[1])).toBeGreaterThan(light(logo[2]));
  });
});

// Contraste WCAG entre dos colores
function contrast(a: string, b: string) {
  const l = (hex: string) => 1.05 / contrastOnWhite(hex) - 0.05;
  const [hi, lo] = [l(a), l(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('SHIFT_COLORS', () => {
  it.each(Object.keys(SHIFT_COLORS) as ShiftColor[])(
    '%s: la abreviatura se lee sobre su fondo (al menos 4,5:1)',
    (key) => {
      expect(contrast(SHIFT_COLORS[key].ink, SHIFT_COLORS[key].fill)).toBeGreaterThanOrEqual(4.5);
    }
  );

  it('una clave desconocida cae en el color por defecto', () => {
    expect(shiftColor('nope')).toBe(SHIFT_COLORS.cielo);
  });
});
