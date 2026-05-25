import { create } from 'zustand';
import type { Unsubscribe } from 'firebase/firestore';
import {
  getMyRsvp,
  removeRsvp,
  setRsvp,
  subscribeToEventAttendees,
  subscribeToMyRsvps,
} from '../services/rsvpsService';
import {
  cancelReminder,
  scheduleEventReminder,
  type ReminderFailure,
} from '../services/reminderService';
import type { Rsvp, RsvpStatus } from '../types';

interface RsvpsState {
  myRsvps: Rsvp[];
  attendeesByEvent: Record<string, Rsvp[]>;
  myRsvpByEvent: Record<string, Rsvp>;
  loadingMyRsvps: boolean;
  error: string | null;
  myRsvpsUnsub: Unsubscribe | null;
  attendeesUnsubs: Record<string, Unsubscribe>;
}

export interface SetRsvpRequest {
  eventId: string;
  eventTitle: string;
  eventStartsAt: Date;
  uid: string;
  userName: string;
  status: RsvpStatus;
}

export interface SetRsvpResult {
  ok: boolean;
  reminderScheduled: boolean;
  reminderFailure: ReminderFailure | null;
}

interface RsvpsActions {
  subscribeMyRsvps: (uid: string) => void;
  unsubscribeMyRsvps: () => void;
  subscribeEventAttendees: (eventId: string) => void;
  unsubscribeEventAttendees: (eventId: string) => void;
  fetchMyRsvp: (eventId: string, uid: string) => Promise<Rsvp | null>;
  setMyRsvp: (request: SetRsvpRequest) => Promise<SetRsvpResult>;
  removeMyRsvp: (eventId: string, uid: string) => Promise<boolean>;
  clearError: () => void;
}

type RsvpsStore = RsvpsState & RsvpsActions;

const INITIAL_STATE: RsvpsState = {
  myRsvps: [],
  attendeesByEvent: {},
  myRsvpByEvent: {},
  loadingMyRsvps: false,
  error: null,
  myRsvpsUnsub: null,
  attendeesUnsubs: {},
};

export const useRsvpsStore = create<RsvpsStore>((set, get) => ({
  ...INITIAL_STATE,

  subscribeMyRsvps: (uid) => {
    if (get().myRsvpsUnsub) return;
    set({ loadingMyRsvps: true });
    const unsub = subscribeToMyRsvps(
      uid,
      (rsvps) => {
        const map = rsvps.reduce<Record<string, Rsvp>>((acc, r) => {
          acc[r.eventId] = r;
          return acc;
        }, {});
        set({ myRsvps: rsvps, myRsvpByEvent: map, loadingMyRsvps: false });
      },
      (message) => set({ error: message, loadingMyRsvps: false }),
    );
    set({ myRsvpsUnsub: unsub });
  },

  unsubscribeMyRsvps: () => {
    const unsub = get().myRsvpsUnsub;
    if (unsub) unsub();
    set({ myRsvpsUnsub: null });
  },

  subscribeEventAttendees: (eventId) => {
    if (get().attendeesUnsubs[eventId]) return;
    const unsub = subscribeToEventAttendees(
      eventId,
      (rsvps) =>
        set((state) => ({
          attendeesByEvent: { ...state.attendeesByEvent, [eventId]: rsvps },
        })),
      (message) => set({ error: message }),
    );
    set((state) => ({
      attendeesUnsubs: { ...state.attendeesUnsubs, [eventId]: unsub },
    }));
  },

  unsubscribeEventAttendees: (eventId) => {
    const unsub = get().attendeesUnsubs[eventId];
    if (unsub) unsub();
    set((state) => {
      const next = { ...state.attendeesUnsubs };
      delete next[eventId];
      return { attendeesUnsubs: next };
    });
  },

  fetchMyRsvp: async (eventId, uid) => {
    const rsvp = await getMyRsvp(eventId, uid);
    if (rsvp) {
      set((state) => ({
        myRsvpByEvent: { ...state.myRsvpByEvent, [eventId]: rsvp },
      }));
    }
    return rsvp;
  },

  setMyRsvp: async (request) => {
    const previous = get().myRsvpByEvent[request.eventId];
    let reminderId: string | null = previous?.reminderNotificationId ?? null;
    let reminderScheduled = false;
    let reminderFailure: ReminderFailure | null = null;

    if (previous?.reminderNotificationId && request.status !== 'going') {
      await cancelReminder(previous.reminderNotificationId);
      reminderId = null;
    }

    if (request.status === 'going') {
      if (previous?.reminderNotificationId) {
        await cancelReminder(previous.reminderNotificationId);
      }
      const outcome = await scheduleEventReminder({
        eventId: request.eventId,
        eventTitle: request.eventTitle,
        eventStartsAt: request.eventStartsAt,
      });
      if (outcome.ok) {
        reminderId = outcome.id;
        reminderScheduled = true;
      } else {
        reminderId = null;
        reminderFailure = outcome.reason;
      }
    }

    const result = await setRsvp({
      eventId: request.eventId,
      eventTitle: request.eventTitle,
      uid: request.uid,
      userName: request.userName,
      status: request.status,
      reminderNotificationId: reminderId,
    });
    if (!result.success) {
      set({ error: result.error });
      if (reminderId) await cancelReminder(reminderId);
      return { ok: false, reminderScheduled: false, reminderFailure: null };
    }
    set((state) => ({
      myRsvpByEvent: {
        ...state.myRsvpByEvent,
        [request.eventId]: {
          uid: request.uid,
          userName: request.userName,
          eventId: request.eventId,
          eventTitle: request.eventTitle,
          status: request.status,
          respondedAt: new Date(),
          reminderNotificationId: reminderId,
        },
      },
    }));
    return { ok: true, reminderScheduled, reminderFailure };
  },

  removeMyRsvp: async (eventId, uid) => {
    const previous = get().myRsvpByEvent[eventId];
    if (previous?.reminderNotificationId) {
      await cancelReminder(previous.reminderNotificationId);
    }
    const result = await removeRsvp(eventId, uid);
    if (!result.success) {
      set({ error: result.error });
      return false;
    }
    set((state) => {
      const next = { ...state.myRsvpByEvent };
      delete next[eventId];
      return { myRsvpByEvent: next };
    });
    return true;
  },

  clearError: () => set({ error: null }),
}));
