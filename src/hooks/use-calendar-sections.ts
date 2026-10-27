import { useSyncExternalStore } from 'react';

import {
  type CalendarSection,
  type CalendarSections,
  calendarSectionsWithDefaults,
} from '@/data/calendar-sections';
import { loadJSON, saveJSON } from '@/data/storage';

// Secciones visibles del Calendario, guardadas en el móvil y compartidas entre
// el Calendario y su pantalla de Editar (las dos se enteran de cada cambio)
const KEY = 'daystage.calendar-sections.v1';

let current: CalendarSections | null = null;
const listeners = new Set<() => void>();

function read() {
  current ??= calendarSectionsWithDefaults(loadJSON<object>(KEY, {}));
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setCalendarSection(key: CalendarSection, visible: boolean) {
  current = { ...read(), [key]: visible };
  saveJSON(KEY, current);
  listeners.forEach((l) => l());
}

export function useCalendarSections() {
  return useSyncExternalStore(subscribe, read, read);
}
