import type { EventCategory } from '../../events/types';

export interface UserParticipationStats {
  uid: string;
  totalEventsAttended: number;
  totalEventsCreated: number;
  totalComments: number;
  averageRatingGiven: number | null;
  participationByCategory: Record<EventCategory, number>;
}

export interface EventEngagementStats {
  eventId: string;
  attendeesGoing: number;
  attendeesMaybe: number;
  averageRating: number | null;
  ratingsCount: number;
  commentsCount: number;
}
