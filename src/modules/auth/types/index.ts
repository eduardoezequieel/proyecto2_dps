export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

export type AuthProvider = 'password' | 'google';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  provider: AuthProvider;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  displayName: string;
  email: string;
  password: string;
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  profile: UserProfile | null;
  error: string | null;
}
