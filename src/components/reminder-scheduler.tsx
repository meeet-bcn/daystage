import { useEffect } from 'react';

import { useApp } from '@/data/app-context';
import { scheduleReminders } from '@/data/notifications';
import { planReminders } from '@/data/reminders';
import { useShifts } from '@/data/shifts-context';

/**
 * Sin interfaz: mantiene programados los avisos (antes de cada turno y el día
 * antes de cada concierto con «¡Voy!») según tus turnos, planes y Ajustes.
 */
export function ReminderScheduler() {
  const { plan } = useShifts();
  const { plans, settings } = useApp();
  const shiftLead = settings.shiftReminderMinutes;
  const concerts = settings.notifications.reminders;

  useEffect(() => {
    const timer = setTimeout(() => {
      const reminders = planReminders(plan, plans, Date.now(), {
        shiftLeadMinutes: shiftLead,
        concerts,
      });
      scheduleReminders(reminders).catch((e) => console.warn('[avisos] No se pudieron programar:', e));
    }, 1500);
    return () => clearTimeout(timer);
  }, [plan, plans, shiftLead, concerts]);

  return null;
}
