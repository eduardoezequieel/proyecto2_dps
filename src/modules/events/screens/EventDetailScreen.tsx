import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, ChevronRight, MapPin, MessageCircle, Star, Users } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  Divider,
  LoadingSpinner,
  Screen,
  Text,
} from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { formatDateTime, getDurationLabel } from '../../../shared/utils/formatters';
import { useEventsStore } from '../stores/useEventsStore';
import { isUserOrganizer } from '../services/eventsService';
import { ShareEventButton } from '../components/ShareEventButton';
import { EVENT_CATEGORY_LABELS } from '../types';
import { RsvpButton } from '../../rsvps/components/RsvpButton';
import { useHistoryStore } from '../../history/stores/useHistoryStore';
import { StatsTile } from '../../history/components/StatsTile';

export function EventDetailScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const eventId = typeof params.id === 'string' ? params.id : null;
  const { user } = useAuth();

  const cached = useEventsStore((state) => (eventId ? state.byId[eventId] : undefined));
  const subscribeEvent = useEventsStore((state) => state.subscribeEvent);
  const unsubscribeEvent = useEventsStore((state) => state.unsubscribeEvent);
  const cancel = useEventsStore((state) => state.cancel);

  const eventStats = useHistoryStore((state) =>
    eventId ? state.eventStats[eventId] : undefined,
  );
  const loadEventStats = useHistoryStore((state) => state.loadEventStats);

  const event = cached ?? null;

  useEffect(() => {
    if (!eventId) return;
    subscribeEvent(eventId);
    return () => unsubscribeEvent(eventId);
  }, [eventId, subscribeEvent, unsubscribeEvent]);

  const isOrganizer = event !== null && isUserOrganizer(event, user?.uid ?? null);

  useEffect(() => {
    if (!eventId || !isOrganizer) return;
    if (eventStats) return;
    void loadEventStats(eventId);
  }, [eventId, isOrganizer, eventStats, loadEventStats]);

  if (!event) {
    return (
      <Screen>
        <LoadingSpinner label="Cargando evento..." />
      </Screen>
    );
  }

  const nowMs = Date.now();
  const statusBadge =
    event.status === 'cancelled'
      ? { label: 'Cancelado', tone: 'danger' as const }
      : event.endsAt.getTime() < nowMs
        ? { label: 'Finalizado', tone: 'muted' as const }
        : event.startsAt.getTime() <= nowMs
          ? { label: 'En curso', tone: 'live' as const }
          : null;

  const handleCancelEvent = (): void => {
    Alert.alert(
      'Cancelar evento',
      'Los asistentes veran el evento como cancelado.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar evento',
          style: 'destructive',
          onPress: () => void cancel(event.id),
        },
      ],
    );
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="label" color="textMuted">
          {EVENT_CATEGORY_LABELS[event.category]}
        </Text>
        <Text variant="display" color="textPrimary" style={styles.title}>
          {event.title}
        </Text>
        {statusBadge ? (
          <View
            style={[
              styles.statusBadge,
              statusBadge.tone === 'danger'
                ? styles.statusBadgeDanger
                : statusBadge.tone === 'live'
                  ? styles.statusBadgeLive
                  : styles.statusBadgeMuted,
            ]}
          >
            <Text
              variant="label"
              color={
                statusBadge.tone === 'danger'
                  ? 'danger'
                  : statusBadge.tone === 'live'
                    ? 'success'
                    : 'textSecondary'
              }
            >
              {statusBadge.label}
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text variant="body" color="textSecondary" style={styles.metaText}>
            {formatDateTime(event.startsAt)}
          </Text>
        </View>
        <Text variant="caption" color="textMuted" style={styles.duration}>
          Duracion: {getDurationLabel(event.startsAt, event.endsAt)}
        </Text>

        <View style={styles.metaRow}>
          <MapPin size={16} color={colors.textSecondary} />
          <Text variant="body" color="textSecondary" style={styles.metaText}>
            {event.location.label}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Users size={16} color={colors.textSecondary} />
          <Text variant="body" color="textSecondary" style={styles.metaText}>
            {event.attendeesCount}
            {event.capacity !== null ? ` / ${event.capacity}` : ''} asistentes
          </Text>
        </View>

        {event.averageRating !== null ? (
          <View style={styles.metaRow}>
            <Star size={16} color={colors.warning} />
            <Text variant="body" color="textSecondary" style={styles.metaText}>
              {event.averageRating.toFixed(1)} ({event.ratingsCount} calificaciones)
            </Text>
          </View>
        ) : null}

        <Divider spacing="lg" />

        <Text variant="label" color="textMuted">
          Organizador
        </Text>
        <View style={styles.organizerRow}>
          <Avatar name={event.organizerName} size="md" />
          <Text variant="bodyBold" color="textPrimary" style={styles.organizerName}>
            {event.organizerName}
          </Text>
        </View>

        <Divider spacing="lg" />

        <Text variant="label" color="textMuted">
          Descripcion
        </Text>
        <Text variant="body" color="textPrimary" style={styles.description}>
          {event.description}
        </Text>

        <Divider spacing="lg" />

        {!isOrganizer ? (
          <RsvpButton event={event} />
        ) : event.status === 'scheduled' && event.startsAt.getTime() > nowMs ? (
          <View style={styles.organizerActions}>
            <Button
              label="Editar"
              variant="ghost"
              onPress={() => router.push(`/events/${event.id}/edit`)}
            />
            <View style={{ height: spacing.sm }} />
            <Button
              label="Cancelar evento"
              variant="danger"
              onPress={handleCancelEvent}
            />
          </View>
        ) : null}

        {isOrganizer && eventStats ? (
          <>
            <Divider spacing="lg" />
            <Text variant="label" color="textMuted">
              Estadisticas del evento
            </Text>
            <View style={styles.statsRow}>
              <StatsTile
                label="Confirmados"
                value={eventStats.attendeesGoing.toString()}
              />
              <View style={{ width: spacing.sm }} />
              <StatsTile
                label="Tal vez"
                value={eventStats.attendeesMaybe.toString()}
              />
            </View>
            <View style={styles.statsRow}>
              <StatsTile
                label="Comentarios"
                value={eventStats.commentsCount.toString()}
              />
              <View style={{ width: spacing.sm }} />
              <StatsTile
                label="Calificaciones"
                value={eventStats.ratingsCount.toString()}
              />
            </View>
          </>
        ) : null}

        <Divider spacing="lg" />

        <Card
          onPress={() => router.push(`/events/${event.id}/comments`)}
          padding="md"
          accessibilityLabel={
            event.averageRating !== null
              ? `Comentarios y calificacion. Promedio ${event.averageRating.toFixed(1)} estrellas de ${event.ratingsCount} calificaciones.`
              : 'Comentarios y calificacion. Aun no hay calificaciones.'
          }
          accessibilityHint="Abre los comentarios y la pantalla de calificacion"
        >
          <View style={styles.commentsCardRow}>
            <View style={styles.commentsIcon}>
              <MessageCircle size={22} color={colors.accent} />
            </View>
            <View style={styles.commentsTextWrap}>
              <Text variant="bodyBold" color="textPrimary">
                Comentarios y calificacion
              </Text>
              {event.averageRating !== null ? (
                <View style={styles.commentsSubRow}>
                  <Star size={14} color={colors.warning} />
                  <Text variant="caption" color="textSecondary" style={styles.commentsSubText}>
                    {event.averageRating.toFixed(1)} ({event.ratingsCount} calificaciones)
                  </Text>
                </View>
              ) : (
                <Text variant="caption" color="textSecondary" style={styles.commentsSubText}>
                  Lee opiniones o deja la tuya
                </Text>
              )}
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </View>
        </Card>

        <View style={styles.shareWrap}>
          <ShareEventButton event={event} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  title: { marginTop: spacing.xs, marginBottom: spacing.sm },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.subtle,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  statusBadgeDanger: {
    backgroundColor: colors.accentSubtle,
    borderColor: colors.danger,
  },
  statusBadgeMuted: {
    backgroundColor: colors.accentSubtle,
    borderColor: colors.borderStrong,
  },
  statusBadgeLive: {
    backgroundColor: colors.accentSubtle,
    borderColor: colors.success,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  metaText: { marginLeft: spacing.sm, flex: 1 },
  duration: { marginLeft: 24, marginTop: spacing.xs },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  organizerName: { marginLeft: spacing.md },
  description: { marginTop: spacing.xs },
  organizerActions: { marginTop: spacing.md },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  commentsCardRow: { flexDirection: 'row', alignItems: 'center' },
  commentsIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  commentsTextWrap: { flex: 1 },
  commentsSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  commentsSubText: { marginLeft: spacing.xs },
  shareWrap: { marginTop: spacing.md },
});
