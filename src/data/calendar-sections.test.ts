import { describe, expect, it } from '@jest/globals';

import { calendarSectionsWithDefaults, DEFAULT_CALENDAR_SECTIONS } from '@/data/calendar-sections';

describe('calendarSectionsWithDefaults', () => {
  it('por defecto, solo el mes y los planes', () => {
    expect(calendarSectionsWithDefaults(undefined)).toEqual(DEFAULT_CALENDAR_SECTIONS);
    expect(Object.entries(DEFAULT_CALENDAR_SECTIONS).filter(([, v]) => v)).toEqual([['planes', true]]);
  });

  it('respeta lo guardado e ignora lo que no vale', () => {
    expect(calendarSectionsWithDefaults({ informe: true, planes: false, otra: true, ticket: 'sí' })).toEqual({
      ...DEFAULT_CALENDAR_SECTIONS,
      informe: true,
      planes: false,
    });
  });
});
