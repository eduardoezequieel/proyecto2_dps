import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Button,
  Divider,
  EmptyState,
  LoadingSpinner,
  Screen,
  Text,
} from '../../../shared/components';
import { spacing } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useEventsStore } from '../../events/stores/useEventsStore';
import { useRsvpsStore } from '../../rsvps/stores/useRsvpsStore';
import { useInteractionsStore } from '../stores/useInteractionsStore';
import { CommentInput } from '../components/CommentInput';
import { CommentItem } from '../components/CommentItem';
import { RatingStars } from '../components/RatingStars';
import type { EventComment } from '../types';

const EMPTY_COMMENTS: EventComment[] = [];

export function CommentsScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string }>();
  const eventId = typeof params.id === 'string' ? params.id : null;
  const { user } = useAuth();
  const subscribeEvent = useEventsStore((state) => state.subscribeEvent);
  const unsubscribeEvent = useEventsStore((state) => state.unsubscribeEvent);
  const cached = useEventsStore((state) => (eventId ? state.byId[eventId] : undefined));

  const comments = useInteractionsStore((state) =>
    eventId ? state.commentsByEvent[eventId] ?? EMPTY_COMMENTS : EMPTY_COMMENTS,
  );
  const myRating = useInteractionsStore((state) =>
    eventId ? state.myRatingByEvent[eventId] : undefined,
  );
  const subscribeComments = useInteractionsStore((state) => state.subscribeComments);
  const unsubscribeComments = useInteractionsStore((state) => state.unsubscribeComments);
  const subscribeRatings = useInteractionsStore((state) => state.subscribeRatings);
  const unsubscribeRatings = useInteractionsStore((state) => state.unsubscribeRatings);
  const rateEvent = useInteractionsStore((state) => state.rateEvent);
  const error = useInteractionsStore((state) => state.error);

  const myRsvp = useRsvpsStore((state) =>
    eventId ? state.myRsvpByEvent[eventId] : undefined,
  );
  const fetchMyRsvp = useRsvpsStore((state) => state.fetchMyRsvp);

  const [ratingDraft, setRatingDraft] = useState(myRating?.stars ?? 0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);

  const { topLevel, repliesByParent } = useMemo(() => {
    const top: EventComment[] = [];
    const replies: Record<string, EventComment[]> = {};
    for (const comment of comments) {
      if (comment.parentCommentId === null) {
        top.push(comment);
      } else {
        const bucket = replies[comment.parentCommentId] ?? [];
        bucket.push(comment);
        replies[comment.parentCommentId] = bucket;
      }
    }
    for (const key of Object.keys(replies)) {
      const bucket = replies[key];
      if (bucket) {
        bucket.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }
    }
    return { topLevel: top, repliesByParent: replies };
  }, [comments]);

  useEffect(() => {
    if (!eventId) return;
    subscribeEvent(eventId);
    subscribeComments(eventId);
    subscribeRatings(eventId, user?.uid ?? null);
    return () => {
      unsubscribeEvent(eventId);
      unsubscribeComments(eventId);
      unsubscribeRatings(eventId);
    };
  }, [
    eventId,
    subscribeEvent,
    unsubscribeEvent,
    subscribeComments,
    subscribeRatings,
    unsubscribeComments,
    unsubscribeRatings,
    user?.uid,
  ]);

  useEffect(() => {
    if (myRating) setRatingDraft(myRating.stars);
  }, [myRating]);

  useEffect(() => {
    if (!eventId || !user) return;
    if (myRsvp) return;
    void fetchMyRsvp(eventId, user.uid);
  }, [eventId, user, myRsvp, fetchMyRsvp]);

  if (!eventId || !cached) {
    return (
      <Screen>
        <LoadingSpinner />
      </Screen>
    );
  }

  const event = cached;
  const eventEnded = event.endsAt.getTime() < Date.now();
  const attendedAsGoing = myRsvp?.status === 'going';
  const isOrganizer = user !== null && event.createdBy === user.uid;
  const canRate = user !== null && eventEnded && attendedAsGoing && !isOrganizer;

  const handleRate = async (): Promise<void> => {
    if (!user) return;
    if (ratingDraft < 1 || ratingDraft > 5) {
      Alert.alert('Selecciona estrellas', 'Toca de 1 a 5 estrellas antes de calificar.');
      return;
    }
    setSubmittingRating(true);
    const ok = await rateEvent({
      eventId: event.id,
      uid: user.uid,
      authorName: user.displayName ?? user.email ?? 'Usuario',
      stars: ratingDraft,
      comment: null,
    });
    setSubmittingRating(false);
    if (!ok) Alert.alert('No se pudo guardar tu calificacion', error ?? 'Intenta nuevamente.');
  };

  const renderComment = ({ item }: { item: EventComment }): React.ReactElement => (
    <CommentItem
      comment={item}
      currentUid={user?.uid ?? null}
      organizerUid={event.createdBy}
      replies={repliesByParent[item.id] ?? []}
      onReply={(id, name) => setReplyingTo({ id, name })}
    />
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="h2" color="textPrimary">
          Comentarios
        </Text>
        <Text variant="caption" color="textSecondary">
          {event.title}
        </Text>
      </View>

      {canRate ? (
        <View style={styles.section}>
          <RatingStars
            value={ratingDraft}
            onChange={setRatingDraft}
            label={myRating ? 'Tu calificacion' : 'Califica este evento'}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            label={myRating ? 'Actualizar calificacion' : 'Calificar'}
            variant="ghost"
            onPress={() => void handleRate()}
            loading={submittingRating}
          />
        </View>
      ) : event.averageRating !== null ? (
        <View style={styles.section}>
          <RatingStars value={Math.round(event.averageRating)} readonly label="Calificacion promedio" />
        </View>
      ) : null}

      <Divider spacing="md" />

      {user ? (
        <View style={styles.section}>
          <CommentInput
            eventId={event.id}
            authorUid={user.uid}
            authorName={user.displayName ?? user.email ?? 'Usuario'}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </View>
      ) : null}

      {topLevel.length === 0 ? (
        <EmptyState title="Sin comentarios" message="Se el primero en compartir tu opinion." />
      ) : (
        <FlatList
          data={topLevel}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.list}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
