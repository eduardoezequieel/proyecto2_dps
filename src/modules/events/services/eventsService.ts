import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
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
import type {
  CommunityEvent,
  EventCategory,
  EventDraft,
  EventLocation,
  EventStatus,
} from '../types';

const SCOPE = 'eventsService';
const EVENTS_COLLECTION = 'events';
const CANCELLED_EVENT_SENTINEL = '__event_cancelled__';
const STARTED_EVENT_SENTINEL = '__event_started__';

interface FirestoreEventDoc {
  title: string;
  description: string;
  location: EventLocation;
  startsAt: Timestamp;
  endsAt: Timestamp;
  category: EventCategory;
  capacity: number | null;
  createdBy: string;
  organizerName: string;
  attendeesCount: number;
  averageRating: number | null;
  ratingsCount: number;
  status: EventStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function mapEventDoc(snapshot: QueryDocumentSnapshot<DocumentData>): CommunityEvent {
  const raw = snapshot.data() as FirestoreEventDoc;
  return {
    id: snapshot.id,
    title: raw.title,
    description: raw.description,
    location: raw.location,
    startsAt: raw.startsAt.toDate(),
    endsAt: raw.endsAt.toDate(),
    category: raw.category,
    capacity: raw.capacity,
    createdBy: raw.createdBy,
    organizerName: raw.organizerName,
    attendeesCount: raw.attendeesCount,
    averageRating: raw.averageRating,
    ratingsCount: raw.ratingsCount,
    status: raw.status,
    createdAt: raw.createdAt?.toDate?.() ?? new Date(),
    updatedAt: raw.updatedAt?.toDate?.() ?? new Date(),
  };
}

export interface CreateEventInput {
  draft: EventDraft;
  organizerUid: string;
  organizerName: string;
}

/** Crea un evento nuevo y devuelve su id. */
export async function createEvent(input: CreateEventInput): Promise<AsyncResult<string>> {
  try {
    const ref = await addDoc(collection(db, EVENTS_COLLECTION), {
      title: input.draft.title.trim(),
      description: input.draft.description.trim(),
      location: input.draft.location,
      startsAt: Timestamp.fromDate(input.draft.startsAt),
      endsAt: Timestamp.fromDate(input.draft.endsAt),
      category: input.draft.category,
      capacity: input.draft.capacity,
      createdBy: input.organizerUid,
      organizerName: input.organizerName,
      attendeesCount: 0,
      averageRating: null,
      ratingsCount: 0,
      status: 'scheduled' satisfies EventStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ok(ref.id);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

export interface UpdateEventInput {
  eventId: string;
  draft: EventDraft;
}

/**
 * Actualiza los campos editables de un evento dentro de una transaccion.
 * Falla si el evento ya esta cancelado (`'cancelled-event'`) o ya inicio (`'started-event'`).
 */
export async function updateEvent(input: UpdateEventInput): Promise<AsyncResult<true>> {
  try {
    const ref = doc(db, EVENTS_COLLECTION, input.eventId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) {
        throw new Error('Evento no encontrado');
      }
      const data = snapshot.data();
      if (data?.status === 'cancelled') {
        throw new Error(CANCELLED_EVENT_SENTINEL);
      }
      const startsAtMs = (data?.startsAt as Timestamp | undefined)?.toMillis?.();
      if (typeof startsAtMs === 'number' && startsAtMs <= Date.now()) {
        throw new Error(STARTED_EVENT_SENTINEL);
      }
      transaction.update(ref, {
        title: input.draft.title.trim(),
        description: input.draft.description.trim(),
        location: input.draft.location,
        startsAt: Timestamp.fromDate(input.draft.startsAt),
        endsAt: Timestamp.fromDate(input.draft.endsAt),
        category: input.draft.category,
        capacity: input.draft.capacity,
        updatedAt: serverTimestamp(),
      });
    });
    return ok(true);
  } catch (error) {
    if (error instanceof Error && error.message === CANCELLED_EVENT_SENTINEL) {
      return fail(
        'Este evento fue cancelado. No se puede editar.',
        'cancelled-event',
      );
    }
    if (error instanceof Error && error.message === STARTED_EVENT_SENTINEL) {
      return fail(
        'Este evento ya inicio o finalizo. No se puede editar.',
        'started-event',
      );
    }
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/**
 * Marca el evento como cancelado. Los asistentes lo ven en estado `cancelled` y no pueden modificar RSVPs.
 * Falla si el evento ya inicio (`'started-event'`).
 */
export async function cancelEvent(eventId: string): Promise<AsyncResult<true>> {
  try {
    const ref = doc(db, EVENTS_COLLECTION, eventId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) {
        throw new Error('Evento no encontrado');
      }
      const data = snapshot.data();
      const startsAtMs = (data?.startsAt as Timestamp | undefined)?.toMillis?.();
      if (typeof startsAtMs === 'number' && startsAtMs <= Date.now()) {
        throw new Error(STARTED_EVENT_SENTINEL);
      }
      transaction.update(ref, {
        status: 'cancelled' satisfies EventStatus,
        updatedAt: serverTimestamp(),
      });
    });
    return ok(true);
  } catch (error) {
    if (error instanceof Error && error.message === STARTED_EVENT_SENTINEL) {
      return fail(
        'Este evento ya inicio o finalizo. No se puede cancelar.',
        'started-event',
      );
    }
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

/**
 * Suscribe al doc de un evento individual. Util cuando el usuario esta en la pantalla
 * de detalle o de comentarios y necesita ver los contadores denormalizados
 * (`averageRating`, `ratingsCount`, `attendeesCount`) actualizarse en vivo tras una
 * calificacion o RSVP. Devuelve `null` al callback si el evento no existe.
 */
export function subscribeToEvent(
  eventId: string,
  callback: (event: CommunityEvent | null) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const ref = doc(db, EVENTS_COLLECTION, eventId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback(mapEventDoc(snapshot as QueryDocumentSnapshot<DocumentData>));
    },
    (error) => {
      const handled = handleError(error, SCOPE);
      onError(handled.userMessage);
    },
  );
}

/** Lee un evento por id o devuelve `null` si no existe (errores se silencian al logger). */
export async function getEventById(eventId: string): Promise<CommunityEvent | null> {
  try {
    const ref = doc(db, EVENTS_COLLECTION, eventId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return mapEventDoc(snapshot as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    handleError(error, SCOPE);
    return null;
  }
}

/**
 * Suscribe a los proximos eventos: los que aun no terminan (`endsAt > now`),
 * incluyendo los que estan en curso. Orden: en curso primero (por `endsAt` asc),
 * luego futuros por `startsAt` asc.
 */
export function subscribeToUpcomingEvents(
  callback: (events: CommunityEvent[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const now = Timestamp.fromDate(new Date());
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('endsAt', '>', now),
    orderBy('endsAt', 'asc'),
    limit(100),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const nowMs = Date.now();
      const events = snapshot.docs.map(mapEventDoc);
      events.sort((a, b) => {
        const aLive = a.startsAt.getTime() <= nowMs;
        const bLive = b.startsAt.getTime() <= nowMs;
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        if (aLive) return a.endsAt.getTime() - b.endsAt.getTime();
        return a.startsAt.getTime() - b.startsAt.getTime();
      });
      callback(events);
    },
    (error) => {
      const handled = handleError(error, SCOPE);
      onError(handled.userMessage);
    },
  );
}

/**
 * Suscribe a todos los eventos creados por `uid` (cualquier estado), ordenados
 * por `startsAt` desc. Requiere el indice compuesto `(createdBy, startsAt desc)`.
 */
export function subscribeToOrganizerEvents(
  uid: string,
  callback: (events: CommunityEvent[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('createdBy', '==', uid),
    orderBy('startsAt', 'desc'),
    limit(100),
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map(mapEventDoc)),
    (error) => {
      const handled = handleError(error, SCOPE);
      onError(handled.userMessage);
    },
  );
}

/** Suscribe a los ultimos 100 eventos cuyo `endsAt` ya paso, ordenados desc. */
export function subscribeToPastEvents(
  callback: (events: CommunityEvent[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const now = Timestamp.fromDate(new Date());
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('endsAt', '<', now),
    orderBy('endsAt', 'desc'),
    limit(100),
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map(mapEventDoc)),
    (error) => {
      const handled = handleError(error, SCOPE);
      onError(handled.userMessage);
    },
  );
}

/** Devuelve eventos creados por `uid`, ordenados por `startsAt` desc (hasta 100). */
export async function getEventsByOrganizer(uid: string): Promise<CommunityEvent[]> {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('createdBy', '==', uid),
      orderBy('startsAt', 'desc'),
      limit(100),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapEventDoc);
  } catch (error) {
    handleError(error, SCOPE);
    return [];
  }
}

/** Helper puro: `true` si el evento fue creado por `uid`. */
export function isUserOrganizer(event: CommunityEvent, uid: string | null): boolean {
  if (!uid) return false;
  return event.createdBy === uid;
}

/**
 * Eventos pasados a los que `uid` asistio (`status === 'going'`) o que organizo.
 * Combina collectionGroup query sobre `rsvps/` + `getEventsByOrganizer`.
 */
export async function getUserPastEvents(uid: string): Promise<CommunityEvent[]> {
  try {
    const now = new Date();
    const attendedQuery = query(
      collectionGroup(db, 'rsvps'),
      where('uid', '==', uid),
      where('status', '==', 'going'),
    );
    const attendedSnap = await getDocs(attendedQuery);
    const eventIds = new Set<string>();
    for (const rsvpDoc of attendedSnap.docs) {
      const eventId = rsvpDoc.ref.parent.parent?.id;
      if (eventId) eventIds.add(eventId);
    }

    const organizedPast = await getEventsByOrganizer(uid);
    for (const organized of organizedPast) {
      if (organized.endsAt.getTime() < now.getTime()) {
        eventIds.add(organized.id);
      }
    }

    const events: CommunityEvent[] = [];
    for (const eventId of eventIds) {
      const event = await getEventById(eventId);
      if (event && event.endsAt.getTime() < now.getTime()) {
        events.push(event);
      }
    }

    events.sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime());
    return events;
  } catch (error) {
    handleError(error, SCOPE);
    return [];
  }
}
