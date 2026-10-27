// Exportar turnos (funciones puras): los eventos para el calendario del iPhone
// (un calendario «DayStage» propio) y el HTML del PDF del mes para compartir.

import { formatEuros, formatHours, type MonthReport } from '@/data/reports';
import {
  addDays,
  formatMonth,
  monthGrid,
  shiftInterval,
  type ShiftPlan,
  shortTime,
  typeForDate,
  WEEKDAY_INITIALS,
} from '@/data/shifts';
import { shiftColor } from '@/theme';

export const CALENDAR_TITLE = 'DayStage';
/** Marca en las notas de cada evento: así se reconocen los nuestros al sincronizar. */
export const EVENT_MARK = '[DayStage]';

export type CalendarEvent = {
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  notes: string;
};

/** Tus turnos (y vacaciones, como día entero) desde `from`, `days` días. */
export function calendarEvents(plan: ShiftPlan, from: string, days: number): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const type = typeForDate(date, plan);
    if (!type) continue;
    if (type.off) {
      const [y, m, d] = date.split('-').map(Number);
      out.push({
        title: type.name,
        startDate: new Date(y, m - 1, d),
        endDate: new Date(y, m - 1, d + 1),
        allDay: true,
        notes: EVENT_MARK,
      });
      continue;
    }
    const { start, end } = shiftInterval(date, type);
    out.push({
      title: `Turno: ${type.name}`,
      startDate: new Date(start),
      endDate: new Date(end),
      allDay: false,
      notes: EVENT_MARK,
    });
  }
  return out;
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML de una página con el mes (como en la app) y el resumen del informe. */
export function monthHtml(plan: ShiftPlan, year: number, month: number, report: MonthReport) {
  const rows = monthGrid(year, month)
    .map(
      (week) =>
        `<tr>${week
          .map(({ date, inMonth }) => {
            if (!inMonth) return '<td class="out"></td>';
            const type = typeForDate(date, plan);
            const color = type ? shiftColor(type.color) : null;
            const content = !type
              ? '<span class="free">Libre</span>'
              : type.off
                ? `<b>${escape(type.abbr)}</b>`
                : `<b>${shortTime(type.start)}</b><br><small>${shortTime(type.end)}</small>`;
            const style = color ? ` style="background:${color.fill};color:${color.ink}"` : '';
            return `<td${style}><div class="n">${Number(date.slice(8))}</div>${content}</td>`;
          })
          .join('')}</tr>`
    )
    .join('');
  const stats = [
    ['Horas', formatHours(report.hours)],
    ['Días de trabajo', String(report.workDays)],
    ['Mañanas', String(report.mornings)],
    ['Tardes', String(report.afternoons)],
    ['Noches', String(report.nights)],
    ['Vacaciones', String(report.vacationDays)],
    ['Horas extra', formatHours(report.overtime)],
    ...(report.earnings != null ? [['Ganancias', formatEuros(report.earnings)]] : []),
  ]
    .map(([label, value]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Helvetica, sans-serif; color: #2A2540; margin: 32px; }
    h1 { font-size: 28px; margin: 0 0 4px; } p { color: #6E6E73; margin: 0 0 20px; }
    table { width: 100%; border-collapse: separate; border-spacing: 4px; table-layout: fixed; }
    th { color: #6E6E73; font-size: 12px; } td { height: 64px; vertical-align: top; text-align: center;
      border-radius: 8px; background: #F5F5F7; font-size: 14px; padding: 4px; }
    td.out { background: transparent; } .n { font-size: 11px; opacity: .7; } .free { color: #6E6E73; font-size: 12px; }
    .stats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
    .stat { background: #FAF8FF; border-radius: 10px; padding: 10px 14px; min-width: 120px; }
    .stat b { display: block; font-size: 20px; } .stat span { color: #6E6E73; font-size: 12px; }
  </style></head><body>
    <h1>${formatMonth(year, month)}</h1><p>Mis turnos · DayStage</p>
    <table><tr>${WEEKDAY_INITIALS.map((d) => `<th>${d}</th>`).join('')}</tr>${rows}</table>
    <div class="stats">${stats}</div>
  </body></html>`;
}
