
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    type DocumentData,
    type QueryDocumentSnapshot,
    type Unsubscribe,
} from 'firebase/firestore';
import { fail, ok, type AsyncResult } from '../../../shared/types/result';
import { handleError } from '../../../shared/utils/errorHandler';
import { db } from '../../../shared/utils/firebase';
import type {
    CommunityEvent,
    EventCategory,
    EventDraft,
    EventLocation,
    EventStatus,
} from '../types';

const SCOPE = 'eventsService';
const EVENTS_COLLECTION = 'events';

interface FirestoreEventDoc {
  title: string;
  description: string;
  location: EventLocation;
  startsAt: Timestamp;
  endsAt: Timestamp;
  category: EventCategory;
  coverImageUrl: string | null;
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
    coverImageUrl: raw.coverImageUrl,
    capacity: raw.capacity,
    createdBy: raw.createdBy,
    organizerName: raw.organizerName,
    attendeesCount: raw.attendeesCount,
    averageRating: raw.averageRating,
    ratingsCount: raw.ratingsCount,
    status: raw.status,
    createdAt: raw.createdAt.toDate(),
    updatedAt: raw.updatedAt.toDate(),
  };
}

export interface CreateEventInput {
  draft: EventDraft;
  organizerUid: string;
  organizerName: string;
}

export async function createEvent(input: CreateEventInput): Promise<AsyncResult<string>> {
  try {
    const ref = await addDoc(collection(db, EVENTS_COLLECTION), {
      title: input.draft.title.trim(),
      description: input.draft.description.trim(),
      location: input.draft.location,
      startsAt: Timestamp.fromDate(input.draft.startsAt),
      endsAt: Timestamp.fromDate(input.draft.endsAt),
      category: input.draft.category,
      coverImageUrl: null,
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

export async function updateEvent(input: UpdateEventInput): Promise<AsyncResult<true>> {
  try {
    const ref = doc(db, EVENTS_COLLECTION, input.eventId);
    await updateDoc(ref, {
      title: input.draft.title.trim(),
      description: input.draft.description.trim(),
      location: input.draft.location,
      startsAt: Timestamp.fromDate(input.draft.startsAt),
      endsAt: Timestamp.fromDate(input.draft.endsAt),
      category: input.draft.category,
      capacity: input.draft.capacity,
      updatedAt: serverTimestamp(),
    });
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

export async function cancelEvent(eventId: string): Promise<AsyncResult<true>> {
  try {
    const ref = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(ref, {
      status: 'cancelled' satisfies EventStatus,
      updatedAt: serverTimestamp(),
    });
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

export async function deleteEvent(eventId: string): Promise<AsyncResult<true>> {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

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

export function subscribeToUpcomingEvents(
  callback: (events: CommunityEvent[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const now = Timestamp.fromDate(new Date());
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('status', '==', 'scheduled' satisfies EventStatus),
    where('startsAt', '>=', now),
    orderBy('startsAt', 'asc'),
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

export function isUserOrganizer(event: CommunityEvent, uid: string | null): boolean {
  if (!uid) return false;
  return event.createdBy === uid;
}
