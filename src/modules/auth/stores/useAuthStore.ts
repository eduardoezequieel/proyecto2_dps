import { create } from 'zustand';
import type { Unsubscribe } from 'firebase/auth';
import {
  loginWithEmail,
  loginWithGoogleIdToken,
  logoutUser,
  registerWithEmail,
  requestPasswordReset,
  subscribeToAuthChanges,
} from '../services/authService';
import type { AuthStatus, AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  subscriptionRef: Unsubscribe | null;
}

interface AuthActions {
  init: () => void;
  destroy: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

const INITIAL_STATE: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  subscriptionRef: null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...INITIAL_STATE,

  init: () => {
    if (get().subscriptionRef) return;
    set({ status: 'loading' });
    const unsubscribe = subscribeToAuthChanges((user) => {
      set({ user, status: 'ready', error: null });
    });
    set({ subscriptionRef: unsubscribe });
  },

  destroy: () => {
    const unsubscribe = get().subscriptionRef;
    if (unsubscribe) unsubscribe();
    set({ subscriptionRef: null });
  },

  login: async (email, password) => {
    set({ status: 'authenticating', error: null });
    const result = await loginWithEmail(email, password);
    if (!result.success) {
      set({ status: 'ready', error: result.error });
      return false;
    }
    return true;
  },

  register: async (email, password, displayName) => {
    set({ status: 'authenticating', error: null });
    const result = await registerWithEmail(email, password, displayName);
    if (!result.success) {
      set({ status: 'ready', error: result.error });
      return false;
    }
    return true;
  },

  loginWithGoogle: async (idToken) => {
    set({ status: 'authenticating', error: null });
    const result = await loginWithGoogleIdToken(idToken);
    if (!result.success) {
      set({ status: 'ready', error: result.error });
      return false;
    }
    return true;
  },

  sendPasswordReset: async (email) => {
    set({ error: null });
    const result = await requestPasswordReset(email);
    if (!result.success) {
      set({ error: result.error });
      return false;
    }
    return true;
  },

  logout: async () => {
    await logoutUser();
  },

  clearError: () => set({ error: null }),
}));
