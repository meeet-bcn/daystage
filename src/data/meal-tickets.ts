// Ticket comida (funciones puras): cuántos días del mes llegan a las horas
// mínimas de trabajo y cuánto suman. Cuentan las horas computadas
// (`shiftHours`, sin el descanso no computado); los días libres y las
// vacaciones no cuentan.

import { formatEuros } from '@/data/reports';
import { monthGrid, shiftHours, type ShiftPlan, typeForDate } from '@/data/shifts';

export type MealTicketOptions = {
  /** Horas computadas mínimas en un día para ganar el ticket. */
  minHours: number;
  /** Importe de cada ticket (€). */
  amount: number;
};

export type MealTickets = { count: number; amount: number; total: number };

/** Tickets de un mes (`month` de 1 a 12). */
export function mealTickets(
  plan: ShiftPlan,
  year: number,
  month: number,
  { minHours, amount }: MealTicketOptions
): MealTickets {
  let count = 0;
  for (const week of monthGrid(year, month)) {
    for (const { date, inMonth } of week) {
      if (!inMonth) continue;
      const type = typeForDate(date, plan);
      if (type && !type.off && shiftHours(type) >= minHours) count++;
    }
  }
  return { count, amount, total: Math.round(count * amount * 100) / 100 };
}

/** «Ticket comida: 14 × 9,50 € = 133,00 €». */
export function mealTicketsLabel({ count, amount, total }: MealTickets) {
  return `Ticket comida: ${count} × ${formatEuros(amount)} = ${formatEuros(total)}`;
}
