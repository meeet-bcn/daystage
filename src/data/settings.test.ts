import { describe, expect, it } from '@jest/globals';

import { DEFAULT_SETTINGS, languageLabel, withDefaults } from '@/data/settings';

describe('withDefaults', () => {
  it('sin nada guardado, los de por defecto', () => {
    expect(withDefaults({})).toEqual(DEFAULT_SETTINGS);
  });

  it('mantiene lo guardado y rellena los campos nuevos, también dentro de notificaciones', () => {
    const settings = withDefaults({
      haptics: false,
      notifications: { chat: false } as never,
    });
    expect(settings.haptics).toBe(false);
    expect(settings.notifications).toEqual({ chat: false, reminders: true, newConcerts: false });
  });

  it('un idioma desconocido vuelve al de por defecto', () => {
    expect(withDefaults({ mainLanguage: 'xx' }).mainLanguage).toBe('es');
    expect(withDefaults({ mainLanguage: 'en' }).mainLanguage).toBe('en');
  });

  it('margen tras el turno: 60 min si no hay o no vale, y lo guardado si vale', () => {
    expect(withDefaults({}).shiftMarginMinutes).toBe(60);
    expect(withDefaults({ shiftMarginMinutes: 30 }).shiftMarginMinutes).toBe(30);
    expect(withDefaults({ shiftMarginMinutes: 0 }).shiftMarginMinutes).toBe(0);
    expect(withDefaults({ shiftMarginMinutes: -5 }).shiftMarginMinutes).toBe(60);
    expect(withDefaults({ shiftMarginMinutes: '90' as never }).shiftMarginMinutes).toBe(60);
  });
});


describe('languageLabel', () => {
  it('cada idioma en su idioma', () => {
    expect(languageLabel('en')).toBe('English');
    expect(languageLabel('ca')).toBe('Català');
  });
});
