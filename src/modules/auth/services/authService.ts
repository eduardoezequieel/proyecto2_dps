import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { auth, db } from '../../../shared/utils/firebase';
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  UserProfile,
} from '../types';

export const USERS_COLLECTION = 'users';

type AuthChangeCallback = (user: AuthUser | null) => void;

const getNullableString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }

  return null;
};

const buildUserProfileData = (
  user: User,
  provider: UserProfile['provider'],
): Omit<UserProfile, 'createdAt' | 'updatedAt'> => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  provider,
});

const parseUserProfile = (uid: string, data: Record<string, unknown>): UserProfile => ({
  uid: typeof data.uid === 'string' ? data.uid : uid,
  email: getNullableString(data.email),
  displayName: getNullableString(data.displayName),
  photoURL: getNullableString(data.photoURL),
  provider: data.provider === 'google' ? 'google' : 'password',
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const profileSnapshot = await getDoc(getUserProfileRef(uid));

  if (!profileSnapshot.exists()) {
    return null;
  }

  return parseUserProfile(uid, profileSnapshot.data() as Record<string, unknown>);
};

const createUserProfile = async (
  user: User,
  provider: UserProfile['provider'],
): Promise<void> => {
  const profileRef = getUserProfileRef(user.uid);
  const profileData = buildUserProfileData(user, provider);

  await setDoc(profileRef, {
    ...profileData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

const upsertGoogleUserProfile = async (user: User): Promise<void> => {
  const profileRef = getUserProfileRef(user.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (profileSnapshot.exists()) {
    await updateDoc(profileRef, {
      displayName: user.displayName,
      photoURL: user.photoURL,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(profileRef, {
    ...buildUserProfileData(user, 'google'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const mapFirebaseUserToAuthUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
});

export const getUserProfileRef = (uid: string) => doc(db, USERS_COLLECTION, uid);

export const authService = {
  async loginWithEmail(credentials: LoginCredentials): Promise<AuthUser> {
    const { email, password } = credentials;
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );

    return mapFirebaseUserToAuthUser(userCredential.user);
  },

  async registerWithEmail(credentials: RegisterCredentials): Promise<AuthUser> {
    const { displayName, email, password } = credentials;
    const normalizedDisplayName = displayName.trim();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );

    await updateProfile(userCredential.user, {
      displayName: normalizedDisplayName,
    });

    await createUserProfile(userCredential.user, 'password');

    return mapFirebaseUserToAuthUser(userCredential.user);
  },

  async loginWithGoogle(idToken: string): Promise<AuthUser> {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    await upsertGoogleUserProfile(userCredential.user);

    return mapFirebaseUserToAuthUser(userCredential.user);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    return fetchUserProfile(uid);
  },

  subscribeToAuthChanges(callback: AuthChangeCallback) {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? mapFirebaseUserToAuthUser(user) : null);
    });
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },
};
