import { describe, expect, it } from '@jest/globals';

import { COLORS, PROFILE_BACKGROUNDS, ProfileBackground, themeFor } from '@/theme';

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
    expect(themeFor('none')).toEqual({ accent: COLORS.accent, accentSoft: COLORS.accentSoft });
    expect(themeFor('aurora').accent).toBe(COLORS.accent);
  });

  it.each(Object.keys(PROFILE_BACKGROUNDS) as ProfileBackground[])(
    '%s: el acento se lee sobre blanco (al menos 3:1)',
    (key) => {
      expect(contrastOnWhite(themeFor(key).accent)).toBeGreaterThanOrEqual(3);
    }
  );
});
