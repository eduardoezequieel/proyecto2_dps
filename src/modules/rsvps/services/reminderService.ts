import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleError } from '../../../shared/utils/errorHandler';
import { logger } from '../../../shared/utils/logger';

const SCOPE = 'reminderService';
const DEFAULT_MINUTES_BEFORE = 60;
const ORGANIZER_OFFSETS_MINUTES = [60, 30, 15] as const;
const ORGANIZER_REMINDERS_STORAGE_PREFIX = '@geventos/organizer-reminders/';

function organizerStorageKey(eventId: string): string {
  return `${ORGANIZER_REMINDERS_STORAGE_PREFIX}${eventId}`;
}

function formatOffsetLabel(minutesBefore: number): string {
  if (minutesBefore >= 60 && minutesBefore % 60 === 0) {
    const hours = minutesBefore / 60;
    return hours === 1 ? '1 hora' : `${hours} horas`;
  }
  return `${minutesBefore} min`;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ANDROID_CHANNEL_ID = 'event-reminders';
let channelEnsured = false;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelEnsured) return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Recordatorios de eventos',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFFFFF',
    });
    channelEnsured = true;
  } catch (error) {
    handleError(error, SCOPE);
  }
}

/** Solicita permiso de notificaciones (si hace falta) y asegura el canal de Android. */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    await ensureAndroidChannel();
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
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

export type ReminderFailure = 'denied' | 'past' | 'exception';

export type ReminderResult =
  | { ok: true; id: string }
  | { ok: false; reason: ReminderFailure };

/**
 * Programa una notificacion local 60 min antes del evento (por defecto).
 * Devuelve `{ ok, id }` o `{ ok: false, reason }` indicando porque no se programo.
 */
export async function scheduleEventReminder(
  input: ScheduleReminderInput,
): Promise<ReminderResult> {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      logger.warn(SCOPE, 'Permiso de notificaciones denegado');
      return { ok: false, reason: 'denied' };
    }
    const minutesBefore = input.minutesBefore ?? DEFAULT_MINUTES_BEFORE;
    const triggerAt = new Date(input.eventStartsAt.getTime() - minutesBefore * 60 * 1000);
    if (triggerAt.getTime() <= Date.now()) {
      logger.warn(SCOPE, 'Recordatorio en el pasado, se omite');
      return { ok: false, reason: 'past' };
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
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
      },
    });
    return { ok: true, id };
  } catch (error) {
    handleError(error, SCOPE);
    return { ok: false, reason: 'exception' };
  }
}

/** Cancela un schedule por id. No-op si recibe `null`. */
export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    handleError(error, SCOPE);
  }
}

export interface OrganizerReminderInput {
  eventId: string;
  eventTitle: string;
  eventStartsAt: Date;
}

/**
 * Programa hasta 3 recordatorios (60/30/15 min) para el organizador y persiste los ids en AsyncStorage
 * para poder cancelarlos despues cuando el evento se edita o cancela.
 */
export async function scheduleOrganizerReminders(
  input: OrganizerReminderInput,
): Promise<void> {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      logger.warn(SCOPE, 'Permiso de notificaciones denegado para organizador');
      return;
    }
    const now = Date.now();
    const scheduled: string[] = [];
    for (const minutesBefore of ORGANIZER_OFFSETS_MINUTES) {
      const triggerAt = new Date(
        input.eventStartsAt.getTime() - minutesBefore * 60 * 1000,
      );
      if (triggerAt.getTime() <= now) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Tu evento esta por comenzar',
          body: `${input.eventTitle} comienza en ${formatOffsetLabel(minutesBefore)}.`,
          data: { eventId: input.eventId, kind: 'organizer-reminder', minutesBefore },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerAt,
          channelId: Platform.OS === 'android' ? 'event-reminders' : undefined,
        },
      });
      scheduled.push(id);
    }
    if (scheduled.length === 0) {
      await AsyncStorage.removeItem(organizerStorageKey(input.eventId));
      return;
    }
    await AsyncStorage.setItem(
      organizerStorageKey(input.eventId),
      JSON.stringify(scheduled),
    );
  } catch (error) {
    handleError(error, SCOPE);
  }
}

/** Cancela todos los recordatorios pendientes del organizador para un evento. */
export async function cancelOrganizerReminders(eventId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(organizerStorageKey(eventId));
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const id of parsed) {
          if (typeof id === 'string') {
            await Notifications.cancelScheduledNotificationAsync(id);
          }
        }
      }
    }
    await AsyncStorage.removeItem(organizerStorageKey(eventId));
  } catch (error) {
    handleError(error, SCOPE);
  }
}

/** Conveniencia: cancela y reprograma los recordatorios del organizador tras un edit. */
export async function refreshOrganizerReminders(
  input: OrganizerReminderInput,
): Promise<void> {
  await cancelOrganizerReminders(input.eventId);
  await scheduleOrganizerReminders(input);
}
