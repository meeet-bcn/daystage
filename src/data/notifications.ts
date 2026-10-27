// Avisos locales con expo-notifications (funcionan también en Expo Go): se
// borran y se vuelven a programar todos de una vez (planReminders). En una
// compilación de desarrollo hecha antes de añadir el módulo no existe su parte
// nativa: entonces no hay avisos, pero la app no se cae.

import type * as NotificationsModule from 'expo-notifications';

import type { Reminder } from '@/data/reminders';

function load(): typeof NotificationsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch {
    return null;
  }
}

const Notifications = load();

// Con la app abierta, el aviso se ve igual que con ella cerrada
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Pide permiso solo la primera vez que hace falta. */
async function allowed() {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Sustituye todos los avisos programados por `reminders`. Sin permiso, no hace nada. */
export async function scheduleReminders(reminders: Reminder[]) {
  if (!Notifications) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (reminders.length === 0 || !(await allowed())) return 0;
  for (const r of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(r.at) },
    });
  }
  return reminders.length;
}
