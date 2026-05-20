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
const RATINGS_SUBCOLLECTION = 'ratings';

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

export async function getUserParticipationStats(
  uid: string,
): Promise<UserParticipationStats> {
  const stats: UserParticipationStats = {
    uid,
    totalEventsAttended: 0,
    totalEventsCreated: 0,
    totalComments: 0,
    averageRatingGiven: null,
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
    const attendedEventIds: string[] = [];
    for (const docSnap of attendedSnap.docs) {
      const eventId = docSnap.ref.parent.parent?.id;
      if (eventId) attendedEventIds.push(eventId);
    }

    const createdEvents: CommunityEvent[] = await getEventsByOrganizer(uid);
    stats.totalEventsCreated = createdEvents.length;

    const pastAttended: CommunityEvent[] = [];
    for (const eventId of attendedEventIds) {
      const event = await getEventById(eventId);
      if (event && event.endsAt.getTime() < now.toMillis()) {
        pastAttended.push(event);
        stats.participationByCategory[event.category] += 1;
      }
    }
    stats.totalEventsAttended = pastAttended.length;

    const commentsQuery = query(
      collectionGroup(db, COMMENTS_SUBCOLLECTION),
      where('authorUid', '==', uid),
    );
    stats.totalComments = await countQuery(commentsQuery);

    const ratingsQuery = query(
      collectionGroup(db, RATINGS_SUBCOLLECTION),
      where('uid', '==', uid),
    );
    const ratingsSnap = await getDocs(ratingsQuery);
    if (!ratingsSnap.empty) {
      let total = 0;
      let count = 0;
      for (const ratingDoc of ratingsSnap.docs) {
        const stars = ratingDoc.data()?.stars;
        if (typeof stars === 'number') {
          total += stars;
          count += 1;
        }
      }
      stats.averageRatingGiven = count > 0 ? total / count : null;
    }
  } catch (error) {
    handleError(error, SCOPE);
  }

  return stats;
}

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

export function getAvailableCategories(): ReadonlyArray<EventCategory> {
  return EVENT_CATEGORIES;
}
