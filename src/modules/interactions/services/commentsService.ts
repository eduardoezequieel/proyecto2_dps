import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../../shared/utils/firebase';
import { handleError } from '../../../shared/utils/errorHandler';
import { ok, fail, type AsyncResult } from '../../../shared/types/result';
import type { EventComment } from '../types';

const SCOPE = 'commentsService';
const EVENTS_COLLECTION = 'events';
const COMMENTS_SUBCOLLECTION = 'comments';

interface FirestoreCommentDoc {
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: Timestamp;
  editedAt: Timestamp | null;
}

function mapCommentDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
  eventId: string,
): EventComment {
  const raw = snapshot.data() as FirestoreCommentDoc;
  return {
    id: snapshot.id,
    eventId,
    authorUid: raw.authorUid,
    authorName: raw.authorName,
    text: raw.text,
    createdAt: raw.createdAt.toDate(),
    editedAt: raw.editedAt ? raw.editedAt.toDate() : null,
  };
}

export interface AddCommentInput {
  eventId: string;
  authorUid: string;
  authorName: string;
  text: string;
}

export async function addComment(input: AddCommentInput): Promise<AsyncResult<string>> {
  try {
    const ref = await addDoc(
      collection(db, EVENTS_COLLECTION, input.eventId, COMMENTS_SUBCOLLECTION),
      {
        authorUid: input.authorUid,
        authorName: input.authorName,
        text: input.text.trim(),
        createdAt: serverTimestamp(),
        editedAt: null,
      },
    );
    return ok(ref.id);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

export interface EditCommentInput {
  eventId: string;
  commentId: string;
  text: string;
}

export async function editComment(input: EditCommentInput): Promise<AsyncResult<true>> {
  try {
    const ref = doc(
      db,
      EVENTS_COLLECTION,
      input.eventId,
      COMMENTS_SUBCOLLECTION,
      input.commentId,
    );
    await updateDoc(ref, {
      text: input.text.trim(),
      editedAt: serverTimestamp(),
    });
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

export async function deleteComment(
  eventId: string,
  commentId: string,
): Promise<AsyncResult<true>> {
  try {
    await deleteDoc(
      doc(db, EVENTS_COLLECTION, eventId, COMMENTS_SUBCOLLECTION, commentId),
    );
    return ok(true);
  } catch (error) {
    const handled = handleError(error, SCOPE);
    return fail(handled.userMessage, handled.code);
  }
}

export function subscribeToEventComments(
  eventId: string,
  callback: (comments: EventComment[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const q = query(
    collection(db, EVENTS_COLLECTION, eventId, COMMENTS_SUBCOLLECTION),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((d) => mapCommentDoc(d, eventId))),
    (error) => {
      const handled = handleError(error, SCOPE);
      onError(handled.userMessage);
    },
  );
}
