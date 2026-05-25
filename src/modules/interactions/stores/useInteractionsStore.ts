import { create } from 'zustand';
import type { Unsubscribe } from 'firebase/firestore';
import {
  addComment,
  deleteComment,
  editComment,
  subscribeToEventComments,
} from '../services/commentsService';
import {
  submitRating,
  subscribeToEventRatings,
} from '../services/ratingsService';
import type { EventComment, EventRating } from '../types';

interface InteractionsState {
  commentsByEvent: Record<string, EventComment[]>;
  ratingsByEvent: Record<string, EventRating[]>;
  myRatingByEvent: Record<string, EventRating>;
  error: string | null;
  commentsUnsubs: Record<string, Unsubscribe>;
  ratingsUnsubs: Record<string, Unsubscribe>;
}

interface AddCommentRequest {
  eventId: string;
  authorUid: string;
  authorName: string;
  text: string;
  parentCommentId: string | null;
}

interface SubmitRatingRequest {
  eventId: string;
  uid: string;
  authorName: string;
  stars: number;
  comment: string | null;
}

interface InteractionsActions {
  subscribeComments: (eventId: string) => void;
  unsubscribeComments: (eventId: string) => void;
  subscribeRatings: (eventId: string, currentUid: string | null) => void;
  unsubscribeRatings: (eventId: string) => void;
  postComment: (request: AddCommentRequest) => Promise<boolean>;
  updateComment: (eventId: string, commentId: string, text: string) => Promise<boolean>;
  removeComment: (eventId: string, commentId: string) => Promise<boolean>;
  rateEvent: (request: SubmitRatingRequest) => Promise<boolean>;
  clearError: () => void;
}

type InteractionsStore = InteractionsState & InteractionsActions;

const INITIAL_STATE: InteractionsState = {
  commentsByEvent: {},
  ratingsByEvent: {},
  myRatingByEvent: {},
  error: null,
  commentsUnsubs: {},
  ratingsUnsubs: {},
};

export const useInteractionsStore = create<InteractionsStore>((set, get) => ({
  ...INITIAL_STATE,

  subscribeComments: (eventId) => {
    if (get().commentsUnsubs[eventId]) return;
    const unsub = subscribeToEventComments(
      eventId,
      (comments) =>
        set((state) => ({
          commentsByEvent: { ...state.commentsByEvent, [eventId]: comments },
        })),
      (message) => set({ error: message }),
    );
    set((state) => ({
      commentsUnsubs: { ...state.commentsUnsubs, [eventId]: unsub },
    }));
  },

  unsubscribeComments: (eventId) => {
    const unsub = get().commentsUnsubs[eventId];
    if (unsub) unsub();
    set((state) => {
      const next = { ...state.commentsUnsubs };
      delete next[eventId];
      return { commentsUnsubs: next };
    });
  },

  subscribeRatings: (eventId, currentUid) => {
    if (get().ratingsUnsubs[eventId]) return;
    const unsub = subscribeToEventRatings(
      eventId,
      (ratings) => {
        const myRating = currentUid
          ? ratings.find((r) => r.uid === currentUid) ?? null
          : null;
        set((state) => {
          const nextMyRating = { ...state.myRatingByEvent };
          if (myRating) nextMyRating[eventId] = myRating;
          else delete nextMyRating[eventId];
          return {
            ratingsByEvent: { ...state.ratingsByEvent, [eventId]: ratings },
            myRatingByEvent: nextMyRating,
          };
        });
      },
      (message) => set({ error: message }),
    );
    set((state) => ({
      ratingsUnsubs: { ...state.ratingsUnsubs, [eventId]: unsub },
    }));
  },

  unsubscribeRatings: (eventId) => {
    const unsub = get().ratingsUnsubs[eventId];
    if (unsub) unsub();
    set((state) => {
      const next = { ...state.ratingsUnsubs };
      delete next[eventId];
      return { ratingsUnsubs: next };
    });
  },

  postComment: async (request) => {
    const result = await addComment(request);
    if (!result.success) {
      set({ error: result.error });
      return false;
    }
    return true;
  },

  updateComment: async (eventId, commentId, text) => {
    const result = await editComment({ eventId, commentId, text });
    if (!result.success) {
      set({ error: result.error });
      return false;
    }
    return true;
  },

  removeComment: async (eventId, commentId) => {
    const result = await deleteComment(eventId, commentId);
    if (!result.success) {
      set({ error: result.error });
      return false;
    }
    return true;
  },

  rateEvent: async (request) => {
    const result = await submitRating(request);
    if (!result.success) {
      set({ error: result.error });
      return false;
    }
    return true;
  },

  clearError: () => set({ error: null }),
}));
