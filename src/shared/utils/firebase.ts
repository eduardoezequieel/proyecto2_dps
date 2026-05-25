import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence: (storage: unknown) => Persistence;
  }
).getReactNativePersistence;

interface FirebaseEnv {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
}

function readFirebaseEnv(): FirebaseEnv {
  const extra = Constants.expoConfig?.extra ?? {};
  const required: Array<keyof FirebaseEnv> = [
    'firebaseApiKey',
    'firebaseAuthDomain',
    'firebaseProjectId',
    'firebaseStorageBucket',
    'firebaseMessagingSenderId',
    'firebaseAppId',
  ];
  for (const key of required) {
    if (typeof extra[key] !== 'string' || extra[key].length === 0) {
      throw new Error(
        `Firebase config invalida: falta "${key}" en app.json -> expo.extra`,
      );
    }
  }
  return {
    firebaseApiKey: extra.firebaseApiKey as string,
    firebaseAuthDomain: extra.firebaseAuthDomain as string,
    firebaseProjectId: extra.firebaseProjectId as string,
    firebaseStorageBucket: extra.firebaseStorageBucket as string,
    firebaseMessagingSenderId: extra.firebaseMessagingSenderId as string,
    firebaseAppId: extra.firebaseAppId as string,
  };
}

const env = readFirebaseEnv();

const firebaseConfig = {
  apiKey: env.firebaseApiKey,
  authDomain: env.firebaseAuthDomain,
  projectId: env.firebaseProjectId,
  storageBucket: env.firebaseStorageBucket,
  messagingSenderId: env.firebaseMessagingSenderId,
  appId: env.firebaseAppId,
};

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;

export const auth: Auth =
  getApps().length === 1
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      })
    : getAuth(app);

export const db: Firestore = getFirestore(app);
export { app };
