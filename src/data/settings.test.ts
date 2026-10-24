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
});


describe('languageLabel', () => {
  it('cada idioma en su idioma', () => {
    expect(languageLabel('en')).toBe('English');
    expect(languageLabel('ca')).toBe('Català');
  });
});
