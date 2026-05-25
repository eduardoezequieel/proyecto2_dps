import {
  collection,
  collectionGroup,
  getCountFromServer,
  getDocs,
  query,
  where,
  Timestamp,
  type Query,
} from 'firebase/firestore';
import { db } from '../../../shared/utils/firebase';
import { handleError } from '../../../shared/utils/errorHandler';
import {
  EVENT_CATEGORIES,
  type CommunityEvent,
  type EventCategory,
} from '../../events/types';
import { getEventById, getEventsByOrganizer } from '../../events/services/eventsService';
import type { UserParticipationStats, EventEngagementStats } from '../types';

const SCOPE = 'statsService';
const EVENTS_COLLECTION = 'events';
const RSVPS_SUBCOLLECTION = 'rsvps';
const COMMENTS_SUBCOLLECTION = 'comments';

function emptyCategoryMap(): Record<EventCategory, number> {
  const map: Record<EventCategory, number> = {
    social: 0,
    cultural: 0,
    deportivo: 0,
    educativo: 0,
    voluntariado: 0,
    otro: 0,
  };
  return map;
}

async function countQuery(q: Query): Promise<number> {
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

/**
 * Calcula los agregados de participacion del usuario:
 * eventos asistidos/organizados (sin doble conteo), total comentarios,
 * rating promedio recibido en los eventos que organizó, y participacion por
 * categoria. Usa collectionGroup queries sobre rsvps/comments.
 */
export async function getUserParticipationStats(
  uid: string,
): Promise<UserParticipationStats> {
  const stats: UserParticipationStats = {
    uid,
    totalEventsAttended: 0,
    totalEventsCreated: 0,
    totalComments: 0,
    averageRatingReceived: null,
    participationByCategory: emptyCategoryMap(),
  };

  try {
    const now = Timestamp.fromDate(new Date());

    const attendedQuery = query(
      collectionGroup(db, RSVPS_SUBCOLLECTION),
      where('uid', '==', uid),
      where('status', '==', 'going'),
    );
    const attendedSnap = await getDocs(attendedQuery);
    const rsvpEventIds: string[] = [];
    for (const docSnap of attendedSnap.docs) {
      const eventId = docSnap.ref.parent.parent?.id;
      if (eventId) rsvpEventIds.push(eventId);
    }

    const createdEvents: CommunityEvent[] = await getEventsByOrganizer(uid);
    stats.totalEventsCreated = createdEvents.length;

    // Dedupe via Map: si organicé un evento Y RSVPié, cuenta una sola vez.
    const participated = new Map<string, CommunityEvent>();

    for (const eventId of rsvpEventIds) {
      const event = await getEventById(eventId);
      if (
        event &&
        event.status === 'scheduled' &&
        event.endsAt.getTime() < now.toMillis()
      ) {
        participated.set(event.id, event);
      }
    }

    for (const created of createdEvents) {
      if (
        created.status === 'scheduled' &&
        created.endsAt.getTime() < now.toMillis()
      ) {
        participated.set(created.id, created);
      }
    }

    for (const event of participated.values()) {
      stats.participationByCategory[event.category] += 1;
    }
    stats.totalEventsAttended = participated.size;

    const commentsQuery = query(
      collectionGroup(db, COMMENTS_SUBCOLLECTION),
      where('authorUid', '==', uid),
    );
    stats.totalComments = await countQuery(commentsQuery);

    // Promedio ponderado de ratings recibidos en los eventos que organizó el usuario:
    // pool todas las estrellas (averageRating * ratingsCount) y dividir por el total de
    // calificaciones. Eventos sin ratings se ignoran. Usamos los contadores denormalizados
    // del doc del evento para evitar volver a leer cada subcolección.
    let totalStars = 0;
    let totalRatings = 0;
    for (const created of createdEvents) {
      if (created.averageRating === null || created.ratingsCount <= 0) continue;
      totalStars += created.averageRating * created.ratingsCount;
      totalRatings += created.ratingsCount;
    }
    stats.averageRatingReceived = totalRatings > 0 ? totalStars / totalRatings : null;
  } catch (error) {
    handleError(error, SCOPE);
  }

  return stats;
}

/** Lectura puntual de los agregados de un evento: confirmados, tal vez, comentarios, rating promedio. */
export async function getEventEngagementStats(
  eventId: string,
): Promise<EventEngagementStats> {
  const stats: EventEngagementStats = {
    eventId,
    attendeesGoing: 0,
    attendeesMaybe: 0,
    averageRating: null,
    ratingsCount: 0,
    commentsCount: 0,
  };

  try {
    const rsvpsRef = collection(db, EVENTS_COLLECTION, eventId, RSVPS_SUBCOLLECTION);
    stats.attendeesGoing = await countQuery(query(rsvpsRef, where('status', '==', 'going')));
    stats.attendeesMaybe = await countQuery(query(rsvpsRef, where('status', '==', 'maybe')));

    const commentsRef = collection(db, EVENTS_COLLECTION, eventId, COMMENTS_SUBCOLLECTION);
    stats.commentsCount = await countQuery(query(commentsRef));

    const event = await getEventById(eventId);
    if (event) {
      stats.averageRating = event.averageRating;
      stats.ratingsCount = event.ratingsCount;
    }
  } catch (error) {
    handleError(error, SCOPE);
  }

  return stats;
}

/** Helper puro: lista canonica de categorias para selectors. */
export function getAvailableCategories(): ReadonlyArray<EventCategory> {
  return EVENT_CATEGORIES;
}
