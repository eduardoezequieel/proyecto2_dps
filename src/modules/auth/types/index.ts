export type AuthProvider = 'password' | 'google';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: AuthProvider;
}

export interface UserProfile extends AuthUser {
  createdAt: Date;
  lastSignInAt: Date;
  pushToken: string | null;
  bio: string | null;
}

export type AuthStatus = 'idle' | 'loading' | 'ready' | 'authenticating';

export interface AuthError {
  code: string;
  message: string;
}
