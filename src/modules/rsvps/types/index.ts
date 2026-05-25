export type RsvpStatus = 'going' | 'maybe' | 'not_going';

export interface Rsvp {
  uid: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  status: RsvpStatus;
  respondedAt: Date;
  reminderNotificationId: string | null;
}

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  going: 'Asistire',
  maybe: 'Tal vez',
  not_going: 'No asistire',
};
