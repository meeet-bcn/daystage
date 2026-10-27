// Exportar turnos: al calendario del iPhone (expo-calendar, calendario
// «DayStage» propio; no funciona en Expo Go, solo en la app compilada) y PDF
// del mes para compartir (expo-print + expo-sharing, también en Expo Go).

import type * as CalendarModule from 'expo-calendar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { MonthReport } from '@/data/reports';
import { calendarEvents, CALENDAR_TITLE, EVENT_MARK, monthHtml } from '@/data/shift-export';
import { addDays, type ShiftPlan, toDateKey } from '@/data/shifts';

/** Desde hace una semana hasta dentro de tres meses. */
const PAST_DAYS = 7;
const FUTURE_DAYS = 90;

// Sin su parte nativa (Expo Go o una compilación antigua), no hay calendario
function loadCalendar(): typeof CalendarModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('expo-calendar') as typeof CalendarModule;
    module.getSourcesSync?.();
    return module;
  } catch {
    return null;
  }
}

export type CalendarSyncResult =
  | { ok: true; events: number }
  | { ok: false; reason: 'unavailable' | 'denied' };

/** El calendario «DayStage»; si no existe, se crea con el color de la app. */
async function ownCalendar(Calendar: typeof CalendarModule) {
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const existing = calendars.find((c) => c.title === CALENDAR_TITLE && c.allowsModifications);
  if (existing) return existing;
  const source =
    Platform.OS === 'ios'
      ? Calendar.getDefaultCalendarSync().source
      : { isLocalAccount: true, name: CALENDAR_TITLE, type: Calendar.SourceType.LOCAL };
  return Calendar.createCalendar({
    title: CALENDAR_TITLE,
    name: CALENDAR_TITLE,
    color: '#8F78F5',
    entityType: Calendar.EntityTypes.EVENT,
    source,
    sourceId: source.id,
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

/**
 * Copia tus turnos al calendario «DayStage» del iPhone. Sin duplicados: antes
 * borra los eventos de DayStage de ese intervalo y vuelve a crearlos.
 */
export async function syncToCalendar(plan: ShiftPlan): Promise<CalendarSyncResult> {
  const Calendar = loadCalendar();
  if (!Calendar) return { ok: false, reason: 'unavailable' };
  const { granted } = await Calendar.requestCalendarPermissions();
  if (!granted) return { ok: false, reason: 'denied' };

  const calendar = await ownCalendar(Calendar);
  const from = addDays(toDateKey(), -PAST_DAYS);
  const [y, m, d] = from.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + PAST_DAYS + FUTURE_DAYS + 1);
  for (const event of await calendar.listEvents(start, end)) {
    if (event.notes?.includes(EVENT_MARK)) await event.delete();
  }
  const events = calendarEvents(plan, from, PAST_DAYS + FUTURE_DAYS);
  for (const e of events) await calendar.createEvent(e);
  return { ok: true, events: events.length };
}

/** PDF del mes (calendario y resumen) y la hoja de compartir del sistema. */
export async function shareMonthPdf(plan: ShiftPlan, year: number, month: number, report: MonthReport) {
  const { uri } = await Print.printToFileAsync({ html: monthHtml(plan, year, month, report) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Mis turnos' });
  }
  return uri;
}
