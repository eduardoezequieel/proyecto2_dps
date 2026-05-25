import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../shared/utils/firebase';
import { handleError } from '../../../shared/utils/errorHandler';
import { ok, fail, type AsyncResult } from '../../../shared/types/result';
import type { Rsvp, RsvpStatus } from '../types';

const SCOPE = 'rsvpsService';
const EVENTS_COLLECTION = 'events';
const RSVPS_SUBCOLLECTION = 'rsvps';
const CANCELLED_EVENT_SENTINEL = '__rsvp_cancelled_event__';
const EVENT_FULL_SENTINEL = '__rsvp_event_full__';

interface FirestoreRsvpDoc {
  uid: string;
  userName: string;
  eventTitle?: string;
  status: RsvpStatus;
  respondedAt: Timestamp;
  reminderNotificationId: string | null;
}

function mapRsvpDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  eventId: string,
): Rsvp {
  const raw = snapshot.data() as FirestoreRsvpDoc;
  return {
    uid: raw.uid,
    userName: raw.userName,
    eventId,
    eventTitle: raw.eventTitle ?? 'Evento',
    status: raw.status,
    respondedAt: raw.respondedAt?.toDate?.() ?? new Date(),
    reminderNotificationId: raw.reminderNotificationId,
  };
}

function extractEventIdFromPath(refPath: string): string {
  const parts = refPath.split('/');
  const eventsIndex = parts.indexOf(EVENTS_COLLECTION);
  return eventsIndex >= 0 ? (parts[eventsIndex + 1] ?? '') : '';
}

export interface SetRsvpInput {
  eventId: string;
  eventTitle: string;
  uid: string;
  userName: string;
  status: RsvpStatus;
  reminderNotificationId: string | null;
}

/**
 * Crea o actualiza el RSVP del usuario para un evento dentro de una transaccion.
 * Mantiene `attendeesCount` consistente y rechaza `'going'` si la capacidad esta llena (`'event-full'`)
 * o si el evento esta cancelado (`'cancelled-event'`).
 */
export async function setRsvp(input: SetRsvpInput): Promise<AsyncResult<true>> {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, input.eventId);
    const rsvpRef = doc(
      db,
      EVENTS_COLLECTION,
      input.eventId,
      RSVPS_SUBCOLLECTION,
      input.uid,
    );

    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists()) {
        throw new Error('Evento no encontrado');
      }
      const eventData = eventSnap.data();
      if (eventData?.status === 'cancelled') {
        throw new Error(CANCELLED_EVENT_SENTINEL);
      }
      const previousSnap = await transaction.get(rsvpRef);
      const previousStatus = previousSnap.exists()
        ? (previousSnap.data() as FirestoreRsvpDoc).status
        : null;

      const wasGoing = previousStatus === 'going';
      const isGoing = input.status === 'going';
      const currentCount =
        typeof eventData?.attendeesCount === 'number' ? eventData.attendeesCount : 0;
      const capacity =
        typeof eventData?.capacity === 'number' ? eventData.capacity : null;

      if (!wasGoing && isGoing && capacity !== null && currentCount >= capacity) {
        throw new Error(EVENT_FULL_SENTINEL);
      }

      let delta = 0;
      if (!wasGoing && isGoing) delta = 1;
      else if (wasGoing && !isGoing) delta = -1;

      transaction.set(rsvpRef, {
        uid: input.uid,
        userName: input.userName,
        eventTitle: input.eventTitle,
        status: input.status,
        respondedAt: serverTimestamp(),
        reminderNotificationId: input.reminderNotificationId,
      });

      if (delta !== 0) {
        transaction.update(eventRef, {
          attendeesCount: Math.max(0, currentCount + delta),
        });
      }
    });

    return ok(true);
  } catch (error) {
    if (error instanceof Error && error.message === CANCELLED_EVENT_SENTINEL) {
      return fail(
        'Este evento fue cancelado. No se puede modificar la asistencia.',
        'cancelled-event',
      );
    }
    if (error instanceof Error && error.message === EVENT_FULL_SENTINEL) {
      return fail(
        'Evento lleno. No hay cupos disponibles para confirmar asistencia.',
        'event-full',
      );
    }
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/** Elimina el RSVP y, si era `'going'`, decrementa `attendeesCount` en la misma transaccion. */
export async function removeRsvp(
  eventId: string,
  uid: string,
): Promise<AsyncResult<true>> {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    const rsvpRef = doc(db, EVENTS_COLLECTION, eventId, RSVPS_SUBCOLLECTION, uid);

    await runTransaction(db, async (transaction) => {
      const previousSnap = await transaction.get(rsvpRef);
      if (!previousSnap.exists()) return;
      const previous = previousSnap.data() as FirestoreRsvpDoc;
      const eventSnap = await transaction.get(eventRef);
      const currentCount =
        eventSnap.exists() && typeof eventSnap.data()?.attendeesCount === 'number'
          ? (eventSnap.data().attendeesCount as number)
          : 0;
      transaction.delete(rsvpRef);
      if (previous.status === 'going' && eventSnap.exists()) {
        transaction.update(eventRef, {
          attendeesCount: Math.max(0, currentCount - 1),
        });
      }
    });

    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/** Lee el RSVP especifico del usuario para un evento, o `null` si no existe. */
export async function getMyRsvp(eventId: string, uid: string): Promise<Rsvp | null> {
  try {
    const ref = doc(db, EVENTS_COLLECTION, eventId, RSVPS_SUBCOLLECTION, uid);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return mapRsvpDoc(snapshot as QueryDocumentSnapshot<DocumentData>, eventId);
  } catch (error) {
    handleError(error, SCOPE);
    return null;
  }
}

/** Suscribe a los RSVPs con `status === 'going'` de un evento, ordenados por `respondedAt` desc. */
export function subscribeToEventAttendees(
  eventId: string,
  callback: (rsvps: Rsvp[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, EVENTS_COLLECTION, eventId, RSVPS_SUBCOLLECTION),
    where('status', '==', 'going' satisfies RsvpStatus),
    orderBy('respondedAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((d) => mapRsvpDoc(d, eventId))),
    (error) => {
      const handled = handleError(error, SCOPE);
      onError(handled.userMessage);
    },
  );
}

/**
 * Suscribe a todos los RSVPs del usuario en cualquier evento (collectionGroup query).
 * Requiere el indice de `rsvps.uid` en `firestore.indexes.json`.
 */
export function subscribeToMyRsvps(
  uid: string,
  callback: (rsvps: Rsvp[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collectionGroup(db, RSVPS_SUBCOLLECTION),
    where('uid', '==', uid),
    orderBy('respondedAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) =>
      callback(
        snapshot.docs.map((d) => mapRsvpDoc(d, extractEventIdFromPath(d.ref.path))),
      ),
    (error) => {
      const handled = handleError(error, SCOPE);
      onError(handled.userMessage);
    },
  );
}
