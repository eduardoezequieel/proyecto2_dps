import { FirebaseError } from 'firebase/app';
import { logger } from './logger';

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El correo electronico no es valido.',
  'auth/user-not-found': 'No existe una cuenta con este correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-credential': 'Credenciales invalidas. Verifica tus datos.',
  'auth/email-already-in-use': 'Este correo ya esta registrado.',
  'auth/weak-password': 'La contraseña es demasiado debil.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta mas tarde.',
  'auth/network-request-failed': 'Sin conexion a internet.',
  'auth/popup-closed-by-user': 'Inicio de sesion cancelado.',
  'auth/operation-not-allowed': 'Este metodo de acceso no esta habilitado.',
  'permission-denied': 'No tienes permisos para realizar esta accion.',
  unavailable: 'Servicio temporalmente no disponible.',
  'failed-precondition': 'La operacion no se puede completar en este momento.',
  'not-found': 'El recurso solicitado no existe.',
  'already-exists': 'El recurso ya existe.',
  cancelled: 'Operacion cancelada.',
};

const DEFAULT_USER_MESSAGE = 'Ocurrio un error. Intenta nuevamente.';

export interface HandledError {
  userMessage: string;
  code: string;
}

export function handleError(error: unknown, scope: string): HandledError {
  if (error instanceof FirebaseError) {
    const message = FIREBASE_ERROR_MESSAGES[error.code] ?? DEFAULT_USER_MESSAGE;
    logger.error(scope, error.code, { message: error.message });
    return { userMessage: message, code: error.code };
  }
  if (error instanceof Error) {
    logger.error(scope, error.name, { message: error.message });
    return { userMessage: DEFAULT_USER_MESSAGE, code: error.name };
  }
  logger.error(scope, 'unknown', { error: String(error) });
  return { userMessage: DEFAULT_USER_MESSAGE, code: 'unknown' };
}

export function getFirebaseErrorMessage(code: string): string {
  return FIREBASE_ERROR_MESSAGES[code] ?? DEFAULT_USER_MESSAGE;
}
