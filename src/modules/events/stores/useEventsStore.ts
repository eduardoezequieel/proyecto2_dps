import { create } from 'zustand';
import type { Unsubscribe } from 'firebase/firestore';
import {
  cancelEvent,
  createEvent,
  getEventById,
  subscribeToEvent,
  subscribeToOrganizerEvents,
  subscribeToPastEvents,
  subscribeToUpcomingEvents,
  updateEvent,
  type CreateEventInput,
  type UpdateEventInput,
} from '../services/eventsService';
import {
  cancelOrganizerReminders,
  refreshOrganizerReminders,
  scheduleOrganizerReminders,
} from '../../rsvps/services/reminderService';
import type { CommunityEvent } from '../types';

interface EventsState {
  upcoming: CommunityEvent[];
  past: CommunityEvent[];
  mine: CommunityEvent[];
  byId: Record<string, CommunityEvent>;
  loadingUpcoming: boolean;
  loadingPast: boolean;
  loadingMine: boolean;
  error: string | null;
  upcomingUnsub: Unsubscribe | null;
  pastUnsub: Unsubscribe | null;
  mineUnsub: Unsubscribe | null;
  eventUnsubs: Record<string, Unsubscribe>;
  eventSubCount: Record<string, number>;
}

interface EventsActions {
  subscribeUpcoming: () => void;
  subscribePast: () => void;
  subscribeMine: (uid: string) => void;
  unsubscribeUpcoming: () => void;
  unsubscribePast: () => void;
  unsubscribeMine: () => void;
  subscribeEvent: (eventId: string) => void;
  unsubscribeEvent: (eventId: string) => void;
  loadEventById: (eventId: string) => Promise<CommunityEvent | null>;
  create: (input: CreateEventInput) => Promise<string | null>;
  update: (input: UpdateEventInput) => Promise<boolean>;
  cancel: (eventId: string) => Promise<boolean>;
  clearError: () => void;
}

type EventsStore = EventsState & EventsActions;

const INITIAL_STATE: EventsState = {
  upcoming: [],
  past: [],
  mine: [],
  byId: {},
  loadingUpcoming: false,
  loadingPast: false,
  loadingMine: false,
  error: null,
  upcomingUnsub: null,
  pastUnsub: null,
  mineUnsub: null,
  eventUnsubs: {},
  eventSubCount: {},
};

function indexById(events: CommunityEvent[]): Record<string, CommunityEvent> {
  return events.reduce<Record<string, CommunityEvent>>((acc, event) => {
    acc[event.id] = event;
    return acc;
  }, {});
}

export const useEventsStore = create<EventsStore>((set, get) => ({
  ...INITIAL_STATE,

  subscribeUpcoming: () => {
    if (get().upcomingUnsub) return;
    set({ loadingUpcoming: true });
    const unsub = subscribeToUpcomingEvents(
      (events) => {
        set((state) => ({
          upcoming: events,
          loadingUpcoming: false,
          byId: { ...state.byId, ...indexById(events) },
        }));
      },
      (message) => set({ error: message, loadingUpcoming: false }),
    );
    set({ upcomingUnsub: unsub });
  },

  subscribePast: () => {
    if (get().pastUnsub) return;
    set({ loadingPast: true });
    const unsub = subscribeToPastEvents(
      (events) => {
        set((state) => ({
          past: events,
          loadingPast: false,
          byId: { ...state.byId, ...indexById(events) },
        }));
      },
      (message) => set({ error: message, loadingPast: false }),
    );
    set({ pastUnsub: unsub });
  },

  subscribeMine: (uid) => {
    if (get().mineUnsub) return;
    set({ loadingMine: true });
    const unsub = subscribeToOrganizerEvents(
      uid,
      (events) => {
        set((state) => ({
          mine: events,
          loadingMine: false,
          byId: { ...state.byId, ...indexById(events) },
        }));
      },
      (message) => set({ error: message, loadingMine: false }),
    );
    set({ mineUnsub: unsub });
  },

  unsubscribeUpcoming: () => {
    const { upcomingUnsub } = get();
    if (upcomingUnsub) upcomingUnsub();
    set({ upcomingUnsub: null });
  },

  unsubscribePast: () => {
    const { pastUnsub } = get();
    if (pastUnsub) pastUnsub();
    set({ pastUnsub: null });
  },

  unsubscribeMine: () => {
    const { mineUnsub } = get();
    if (mineUnsub) mineUnsub();
    set({ mineUnsub: null });
  },

  // Suscripcion al doc de un evento individual con refcount. Las pantallas de detalle
  // y comentarios pueden coexistir (expo-router push deja la pantalla padre montada);
  // el contador asegura una sola suscripcion Firestore por eventId, y la cancelacion
  // efectiva solo ocurre cuando el ultimo suscriptor sale.
  subscribeEvent: (eventId) => {
    const currentCount = get().eventSubCount[eventId] ?? 0;
    if (currentCount > 0) {
      set((state) => ({
        eventSubCount: { ...state.eventSubCount, [eventId]: currentCount + 1 },
      }));
      return;
    }
    const unsub = subscribeToEvent(
      eventId,
      (event) => {
        if (!event) return;
        set((state) => ({ byId: { ...state.byId, [eventId]: event } }));
      },
      (message) => set({ error: message }),
    );
    set((state) => ({
      eventUnsubs: { ...state.eventUnsubs, [eventId]: unsub },
      eventSubCount: { ...state.eventSubCount, [eventId]: 1 },
    }));
  },

  unsubscribeEvent: (eventId) => {
    const currentCount = get().eventSubCount[eventId] ?? 0;
    if (currentCount <= 1) {
      const unsub = get().eventUnsubs[eventId];
      if (unsub) unsub();
      set((state) => {
        const nextUnsubs = { ...state.eventUnsubs };
        delete nextUnsubs[eventId];
        const nextCount = { ...state.eventSubCount };
        delete nextCount[eventId];
        return { eventUnsubs: nextUnsubs, eventSubCount: nextCount };
      });
      return;
    }
    set((state) => ({
      eventSubCount: { ...state.eventSubCount, [eventId]: currentCount - 1 },
    }));
  },

  loadEventById: async (eventId) => {
    const cached = get().byId[eventId];
    if (cached) return cached;
    const event = await getEventById(eventId);
    if (event) {
      set((state) => ({ byId: { ...state.byId, [eventId]: event } }));
    }
    return event;
  },

  create: async (input) => {
    const result = await createEvent(input);
    if (!result.success) {
      set({ error: result.error });
      return null;
    }
    const eventId = result.data;
    await scheduleOrganizerReminders({
      eventId,
      eventTitle: input.draft.title.trim(),
      eventStartsAt: input.draft.startsAt,
    });
    return eventId;
  },

  update: async (input) => {
    const result = await updateEvent(input);
    if (!result.success) {
      set({ error: result.error });
      return false;
    }
    set((state) => {
      const existing = state.byId[input.eventId];
      if (!existing) return {};
      const merged: CommunityEvent = {
        ...existing,
        title: input.draft.title.trim(),
        description: input.draft.description.trim(),
        location: input.draft.location,
        startsAt: input.draft.startsAt,
        endsAt: input.draft.endsAt,
        category: input.draft.category,
        capacity: input.draft.capacity,
        updatedAt: new Date(),
      };
      return {
        byId: { ...state.byId, [input.eventId]: merged },
        upcoming: state.upcoming.map((event) =>
          event.id === input.eventId ? merged : event,
        ),
        past: state.past.map((event) =>
          event.id === input.eventId ? merged : event,
        ),
        mine: state.mine.map((event) =>
          event.id === input.eventId ? merged : event,
        ),
      };
    });
    await refreshOrganizerReminders({
      eventId: input.eventId,
      eventTitle: input.draft.title.trim(),
      eventStartsAt: input.draft.startsAt,
    });
    return true;
  },

  cancel: async (eventId) => {
    const result = await cancelEvent(eventId);
    if (!result.success) {
      set({ error: result.error });
      return false;
    }
    set((state) => {
      const existing = state.byId[eventId];
      if (!existing) return {};
      const merged: CommunityEvent = {
        ...existing,
        status: 'cancelled',
        updatedAt: new Date(),
      };
      return {
        byId: { ...state.byId, [eventId]: merged },
        upcoming: state.upcoming.map((event) =>
          event.id === eventId ? merged : event,
        ),
        past: state.past.map((event) =>
          event.id === eventId ? merged : event,
        ),
        mine: state.mine.map((event) =>
          event.id === eventId ? merged : event,
        ),
      };
    });
    await cancelOrganizerReminders(eventId);
    return true;
  },

  clearError: () => set({ error: null }),
}));
