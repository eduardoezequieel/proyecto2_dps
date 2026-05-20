export type EventCategory =
  | 'social'
  | 'cultural'
  | 'deportivo'
  | 'educativo'
  | 'voluntariado'
  | 'otro';

export type EventStatus = 'scheduled' | 'cancelled';

export interface EventLocation {
  label: string;
  latitude: number | null;
  longitude: number | null;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  location: EventLocation;
  startsAt: Date;
  endsAt: Date;
  category: EventCategory;
  coverImageUrl: string | null;
  capacity: number | null;
  createdBy: string;
  organizerName: string;
  attendeesCount: number;
  averageRating: number | null;
  ratingsCount: number;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDraft {
  title: string;
  description: string;
  location: EventLocation;
  startsAt: Date;
  endsAt: Date;
  category: EventCategory;
  capacity: number | null;
}

export const EVENT_CATEGORIES: ReadonlyArray<EventCategory> = [
  'social',
  'cultural',
  'deportivo',
  'educativo',
  'voluntariado',
  'otro',
];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  social: 'Social',
  cultural: 'Cultural',
  deportivo: 'Deportivo',
  educativo: 'Educativo',
  voluntariado: 'Voluntariado',
  otro: 'Otro',
};