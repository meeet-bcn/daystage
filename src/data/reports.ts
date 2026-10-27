// Informes de turnos (como los de SuperShift), funciones puras: horas por mes
// y por semana, cuántas mañanas, tardes, noches y días libres, horas extra
// sobre tu jornada y, si pones una tarifa, lo que ganas.

import { addDays, crossesMidnight, monthGrid, shiftHours, type ShiftPlan, type ShiftType, typeForDate } from '@/data/shifts';

export type ShiftKind = 'manana' | 'tarde' | 'noche';

/** Noche si acaba al día siguiente; mañana si acaba a las 19:00 o antes; si no, tarde. */
export function shiftKind(type: Pick<ShiftType, 'start' | 'end'>): ShiftKind {
  if (crossesMidnight(type)) return 'noche';
  const end = Number(type.end.slice(0, 2)) * 60 + Number(type.end.slice(3));
  return end <= 19 * 60 ? 'manana' : 'tarde';
}

export type WeekHours = { start: string; hours: number };

export type MonthReport = {
  /** Días con turno de trabajo. */
  workDays: number;
  hours: number;
  mornings: number;
  afternoons: number;
  nights: number;
  /** Días con un tipo de día libre (vacaciones…). */
  vacationDays: number;
  /** Días sin turno (ni vacaciones). */
  freeDays: number;
  /** Horas por encima de tu jornada, sumadas día a día. */
  overtime: number;
  /** null si no has puesto tarifa. */
  earnings: number | null;
  /** Horas de cada semana (de lunes a domingo) que toca el mes; solo cuentan los días del mes. */
  weeks: WeekHours[];
};

export type ReportOptions = {
  /** Tu jornada por día (horas), para las horas extra. */
  dailyHours: number;
  /** €/h, o null. */
  hourlyRate: number | null;
};

const round = (n: number, decimals = 2) => Math.round(n * 10 ** decimals) / 10 ** decimals;

/** Informe del mes (`month` de 1 a 12). */
export function monthReport(plan: ShiftPlan, year: number, month: number, opts: ReportOptions): MonthReport {
  const report: MonthReport = {
    workDays: 0,
    hours: 0,
    mornings: 0,
    afternoons: 0,
    nights: 0,
    vacationDays: 0,
    freeDays: 0,
    overtime: 0,
    earnings: null,
    weeks: [],
  };
  for (const week of monthGrid(year, month)) {
    let weekHours = 0;
    for (const { date, inMonth } of week) {
      if (!inMonth) continue;
      const type = typeForDate(date, plan);
      if (!type) {
        report.freeDays++;
        continue;
      }
      if (type.off) {
        report.vacationDays++;
        continue;
      }
      const hours = shiftHours(type);
      report.workDays++;
      report.hours += hours;
      weekHours += hours;
      report.overtime += Math.max(0, hours - opts.dailyHours);
      const kind = shiftKind(type);
      if (kind === 'manana') report.mornings++;
      else if (kind === 'tarde') report.afternoons++;
      else report.nights++;
    }
    report.weeks.push({ start: week[0].date, hours: round(weekHours) });
  }
  report.hours = round(report.hours);
  report.overtime = round(report.overtime);
  report.earnings = opts.hourlyRate == null ? null : round(report.hours * opts.hourlyRate);
  return report;
}

/** "37,5 h" / "8 h" */
export function formatHours(hours: number) {
  return `${String(round(hours, 1)).replace('.', ',')} h`;
}

/** "1.234,50 €" */
export function formatEuros(amount: number) {
  const [int, dec] = amount.toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec} €`;
}

/** "27 oct" (lunes de la semana), para el eje de la gráfica. */
export function weekLabel(start: string) {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${Number(start.slice(8))} ${months[Number(start.slice(5, 7)) - 1]}`;
}

/** Último día de la semana que empieza en `start` (para leerla como intervalo). */
export const weekEnd = (start: string) => addDays(start, 6);
