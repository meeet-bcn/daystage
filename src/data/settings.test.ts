import { describe, expect, it } from '@jest/globals';

import { DEFAULT_SETTINGS, languageLabel, parseRate, withDefaults } from '@/data/settings';

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

describe('informes', () => {
  it('jornada y tarifa: lo guardado si vale; si no, por defecto', () => {
    expect(withDefaults({}).workdayHours).toBe(8);
    expect(withDefaults({ workdayHours: 7.5 }).workdayHours).toBe(7.5);
    expect(withDefaults({ workdayHours: 30 }).workdayHours).toBe(8);
    expect(withDefaults({}).hourlyRate).toBeNull();
    expect(withDefaults({ hourlyRate: 12.5 }).hourlyRate).toBe(12.5);
    expect(withDefaults({ hourlyRate: -1 }).hourlyRate).toBeNull();
  });

  it('parseRate', () => {
    expect(parseRate('12,5')).toBe(12.5);
    expect(parseRate(' 10 ')).toBe(10);
    expect(parseRate('')).toBeNull();
    expect(parseRate('abc')).toBeNull();
    expect(parseRate('0')).toBeNull();
  });
});

describe('aviso antes del turno', () => {
  it('solo los minutos que se ofrecen; si no, sin aviso', () => {
    expect(withDefaults({}).shiftReminderMinutes).toBeNull();
    expect(withDefaults({ shiftReminderMinutes: 60 }).shiftReminderMinutes).toBe(60);
    expect(withDefaults({ shiftReminderMinutes: 45 }).shiftReminderMinutes).toBeNull();
  });
});
