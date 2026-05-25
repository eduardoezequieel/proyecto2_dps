import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../../shared/utils/firebase';
import { handleError } from '../../../shared/utils/errorHandler';
import { ok, fail, type AsyncResult } from '../../../shared/types/result';
import type { AuthUser, AuthProvider, UserProfile } from '../types';

const SCOPE = 'authService';
const USERS_COLLECTION = 'users';

function mapFirebaseUser(user: FirebaseUser, provider: AuthProvider): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    provider,
  };
}

function resolveProvider(user: FirebaseUser): AuthProvider {
  const providerId = user.providerData[0]?.providerId;
  return providerId === GoogleAuthProvider.PROVIDER_ID ? 'google' : 'password';
}

async function upsertUserProfile(user: FirebaseUser, provider: AuthProvider): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snap = await getDoc(ref);
  const base = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    provider,
    lastSignInAt: serverTimestamp(),
  };
  if (snap.exists()) {
    await updateDoc(ref, base);
    return;
  }
  await setDoc(ref, {
    ...base,
    createdAt: serverTimestamp(),
    pushToken: null,
    bio: null,
  });
}

/** Inicia sesion con correo y contrasena, sincronizando el perfil en Firestore. */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AsyncResult<AuthUser>> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const provider: AuthProvider = 'password';
    await upsertUserProfile(credential.user, provider);
    return ok(mapFirebaseUser(credential.user, provider));
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/** Crea una cuenta nueva con correo y contrasena, fija el displayName y crea el doc en `users/`. */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<AsyncResult<AuthUser>> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(credential.user, { displayName: displayName.trim() });
    const provider: AuthProvider = 'password';
    await upsertUserProfile(credential.user, provider);
    return ok({
      ...mapFirebaseUser(credential.user, provider),
      displayName: displayName.trim(),
    });
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/** Intercambia un idToken de Google por una sesion de Firebase Auth. */
export async function loginWithGoogleIdToken(
  idToken: string,
): Promise<AsyncResult<AuthUser>> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const provider: AuthProvider = 'google';
    await upsertUserProfile(result.user, provider);
    return ok(mapFirebaseUser(result.user, provider));
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/**
 * Envia un enlace de recuperacion al correo provisto.
 * Firebase responde exito incluso si el correo no existe (anti-enumeration);
 * el llamador debe usar un mensaje generico al usuario.
 */
export async function requestPasswordReset(email: string): Promise<AsyncResult<true>> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/** Cierra la sesion actual. El subscriber emite `null` y el RootGuard redirige a (auth). */
export async function logoutUser(): Promise<AsyncResult<true>> {
  try {
    await signOut(auth);
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/** Subscribe a cambios en la sesion. Devuelve la funcion de unsubscribe para limpiar el listener. */
export function subscribeToAuthChanges(
  callback: (user: AuthUser | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    callback(mapFirebaseUser(firebaseUser, resolveProvider(firebaseUser)));
  });
}

/** Lee el perfil persistido en `users/{uid}` o `null` si no existe. */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const ref = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid,
      email: typeof data.email === 'string' ? data.email : null,
      displayName: typeof data.displayName === 'string' ? data.displayName : null,
      photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
      provider: data.provider === 'google' ? 'google' : 'password',
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      lastSignInAt: data.lastSignInAt?.toDate?.() ?? new Date(),
      pushToken: typeof data.pushToken === 'string' ? data.pushToken : null,
      bio: typeof data.bio === 'string' ? data.bio : null,
    };
  } catch (error) {
    handleError(error, SCOPE);
    return null;
  }
}

/** Persiste el token de push (FCM/APNs) del usuario en `users/{uid}.pushToken`. */
export async function updatePushToken(uid: string, pushToken: string | null): Promise<void> {
  try {
    const ref = doc(db, USERS_COLLECTION, uid);
    await updateDoc(ref, { pushToken });
  } catch (error) {
    handleError(error, SCOPE);
  }
}
