import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { handleError } from '../../../shared/utils/errorHandler';
import { logger } from '../../../shared/utils/logger';

const SCOPE = 'reminderService';
const DEFAULT_MINUTES_BEFORE = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('event-reminders', {
        name: 'Recordatorios de eventos',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFFFFF',
      });
    }
    return requested.granted;
  } catch (error) {
    handleError(error, SCOPE);
    return false;
  }
}

export interface ScheduleReminderInput {
  eventId: string;
  eventTitle: string;
  eventStartsAt: Date;
  minutesBefore?: number;
}

export async function scheduleEventReminder(
  input: ScheduleReminderInput,
): Promise<string | null> {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      logger.warn(SCOPE, 'Permiso de notificaciones denegado');
      return null;
    }
    const minutesBefore = input.minutesBefore ?? DEFAULT_MINUTES_BEFORE;
    const triggerAt = new Date(input.eventStartsAt.getTime() - minutesBefore * 60 * 1000);
    if (triggerAt.getTime() <= Date.now()) {
      logger.warn(SCOPE, 'Recordatorio en el pasado, se omite');
      return null;
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de evento',
        body: `${input.eventTitle} inicia pronto.`,
        data: { eventId: input.eventId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerAt,
        channelId: Platform.OS === 'android' ? 'event-reminders' : undefined,
      },
    });
    return id;
  } catch (error) {
    handleError(error, SCOPE);
    return null;
  }
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    handleError(error, SCOPE);
  }
}