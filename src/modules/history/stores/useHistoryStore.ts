import { create } from 'zustand';
import {
  getEventEngagementStats,
  getUserParticipationStats,
} from '../services/statsService';
import { getUserPastEvents } from '../../events/services/eventsService';
import type { CommunityEvent } from '../../events/types';
import type { EventEngagementStats, UserParticipationStats } from '../types';

interface HistoryState {
  userStats: UserParticipationStats | null;
  eventStats: Record<string, EventEngagementStats>;
  userPastEvents: CommunityEvent[];
  loadingUserStats: boolean;
  loadingEventStats: boolean;
  loadingUserPastEvents: boolean;
  error: string | null;
}

interface HistoryActions {
  loadUserStats: (uid: string) => Promise<void>;
  loadEventStats: (eventId: string) => Promise<void>;
  loadUserPastEvents: (uid: string) => Promise<void>;
  reset: () => void;
}

type HistoryStore = HistoryState & HistoryActions;

const INITIAL_STATE: HistoryState = {
  userStats: null,
  eventStats: {},
  userPastEvents: [],
  loadingUserStats: false,
  loadingEventStats: false,
  loadingUserPastEvents: false,
  error: null,
};

export const useHistoryStore = create<HistoryStore>((set) => ({
  ...INITIAL_STATE,

  loadUserStats: async (uid) => {
    set({ loadingUserStats: true });
    const stats = await getUserParticipationStats(uid);
    set({ userStats: stats, loadingUserStats: false });
  },

  loadEventStats: async (eventId) => {
    set({ loadingEventStats: true });
    const stats = await getEventEngagementStats(eventId);
    set((state) => ({
      eventStats: { ...state.eventStats, [eventId]: stats },
      loadingEventStats: false,
    }));
  },

  loadUserPastEvents: async (uid) => {
    set({ loadingUserPastEvents: true });
    const events = await getUserPastEvents(uid);
    set({ userPastEvents: events, loadingUserPastEvents: false });
  },

  reset: () => set(INITIAL_STATE),
}));
