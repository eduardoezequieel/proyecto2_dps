import { Timestamp } from 'firebase/firestore';

export type FirestoreTimestamp = Timestamp;

export function toDate(value: Timestamp | Date): Date {
  return value instanceof Timestamp ? value.toDate() : value;
}

export function fromDate(value: Date): Timestamp {
  return Timestamp.fromDate(value);
}

export function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}
