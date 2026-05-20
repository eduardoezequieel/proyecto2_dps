export interface EventComment {
  id: string;
  eventId: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: Date;
  editedAt: Date | null;
}

export interface EventRating {
  uid: string;
  eventId: string;
  authorName: string;
  stars: number;
  comment: string | null;
  createdAt: Date;
}

export interface ShareEventPayload {
  eventId: string;
  title: string;
  startsAt: Date;
  locationLabel: string;
  deepLink: string;
}
