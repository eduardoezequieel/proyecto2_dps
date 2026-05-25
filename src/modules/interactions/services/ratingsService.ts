import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../shared/utils/firebase';
import { handleError } from '../../../shared/utils/errorHandler';
import { ok, fail, type AsyncResult } from '../../../shared/types/result';
import type { EventRating } from '../types';

const SCOPE = 'ratingsService';
const EVENTS_COLLECTION = 'events';
const RATINGS_SUBCOLLECTION = 'ratings';

interface FirestoreRatingDoc {
  uid: string;
  authorName: string;
  stars: number;
  comment: string | null;
  createdAt: Timestamp;
}

function mapRatingDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  eventId: string,
): EventRating {
  const raw = snapshot.data() as FirestoreRatingDoc;
  return {
    uid: raw.uid,
    eventId,
    authorName: raw.authorName,
    stars: raw.stars,
    comment: raw.comment,
    createdAt: raw.createdAt?.toDate?.() ?? new Date(),
  };
}

export interface SubmitRatingInput {
  eventId: string;
  uid: string;
  authorName: string;
  stars: number;
  comment: string | null;
}

/**
 * Crea o actualiza la calificacion del usuario para un evento dentro de una transaccion,
 * recalculando `averageRating` y `ratingsCount` denormalizados en el doc del evento.
 * Las reglas requieren que el usuario tenga RSVP con `status === 'going'`.
 */
export async function submitRating(
  input: SubmitRatingInput,
): Promise<AsyncResult<true>> {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, input.eventId);
    const ratingRef = doc(
      db,
      EVENTS_COLLECTION,
      input.eventId,
      RATINGS_SUBCOLLECTION,
      input.uid,
    );

    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists()) throw new Error('Evento no encontrado');
      const previousSnap = await transaction.get(ratingRef);
      const data = eventSnap.data();

      const previousStars = previousSnap.exists()
        ? (previousSnap.data() as FirestoreRatingDoc).stars
        : null;
      const currentSum =
        typeof data?.averageRating === 'number' && typeof data?.ratingsCount === 'number'
          ? data.averageRating * data.ratingsCount
          : 0;
      const currentCount =
        typeof data?.ratingsCount === 'number' ? data.ratingsCount : 0;

      const newCount = previousStars === null ? currentCount + 1 : currentCount;
      const newSum =
        previousStars === null
          ? currentSum + input.stars
          : currentSum - previousStars + input.stars;
      const newAverage = newCount > 0 ? newSum / newCount : null;

      transaction.set(ratingRef, {
        uid: input.uid,
        authorName: input.authorName,
        stars: input.stars,
        comment: input.comment,
        createdAt: serverTimestamp(),
      });
      transaction.update(eventRef, {
        averageRating: newAverage,
        ratingsCount: newCount,
      });
    });

    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/** Suscribe a todas las calificaciones de un evento ordenadas por `createdAt` desc. */
export function subscribeToEventRatings(
  eventId: string,
  callback: (ratings: EventRating[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, EVENTS_COLLECTION, eventId, RATINGS_SUBCOLLECTION),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((d) => mapRatingDoc(d, eventId))),
    (error) => {
      const handled = handleError(error, SCOPE);
      onError(handled.userMessage);
    },
  );
}

/** Lectura puntual (sin suscripcion) de todas las calificaciones de un evento. */
export async function getEventRatingsOnce(eventId: string): Promise<EventRating[]> {
  try {
    const snapshot = await getDocs(
      collection(db, EVENTS_COLLECTION, eventId, RATINGS_SUBCOLLECTION),
    );
    return snapshot.docs.map((d) => mapRatingDoc(d, eventId));
  } catch (error) {
    handleError(error, SCOPE);
    return [];
  }
}
