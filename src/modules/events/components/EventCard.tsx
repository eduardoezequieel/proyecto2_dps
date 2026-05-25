import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar, MapPin, User, Users } from 'lucide-react-native';
import { Card, Chip, Text } from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';
import { formatDateTime } from '../../../shared/utils/formatters';
import {
  EVENT_CATEGORY_LABELS,
  type CommunityEvent,
} from '../types';

interface EventCardProps {
  event: CommunityEvent;
  onPress: () => void;
  isMine?: boolean;
}

export function EventCard({
  event,
  onPress,
  isMine = false,
}: EventCardProps): React.ReactElement {
  const nowMs = Date.now();
  const statusBadge =
    event.status === 'cancelled'
      ? { label: 'Cancelado', tone: 'danger' as const }
      : event.endsAt.getTime() < nowMs
        ? { label: 'Finalizado', tone: 'muted' as const }
        : event.startsAt.getTime() <= nowMs
          ? { label: 'En curso', tone: 'live' as const }
          : null;

  const accessibilityLabel = `${event.title}. ${EVENT_CATEGORY_LABELS[event.category]}. ${isMine ? 'Eres el organizador. ' : `Organiza ${event.organizerName}. `}${formatDateTime(event.startsAt)}. Ubicacion: ${event.location.label}. ${event.attendeesCount} asistentes${event.capacity !== null ? ` de ${event.capacity}` : ''}.${statusBadge ? ` Estado: ${statusBadge.label}.` : ''}`;

  return (
    <Card
      onPress={onPress}
      padding="none"
      style={[styles.card, isMine && styles.cardMine]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Abre el detalle del evento"
    >
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text variant="label" color="accent" style={styles.headerCategory}>
            {EVENT_CATEGORY_LABELS[event.category]}
          </Text>
          {statusBadge ? (
            <Chip
              label={statusBadge.label}
              selected={statusBadge.tone === 'live'}
              accessibilityLabel={`Estado: ${statusBadge.label}`}
            />
          ) : null}
        </View>
        <Text variant="h2" color="textPrimary" style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text variant="caption" color="textSecondary" style={styles.metaText}>
            {formatDateTime(event.startsAt)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text variant="caption" color="textSecondary" style={styles.metaText} numberOfLines={1}>
            {event.location.label}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <User size={14} color={colors.textSecondary} />
          <Text variant="caption" color="textSecondary" style={styles.metaText} numberOfLines={1}>
            {isMine ? 'Tu organizas este evento' : event.organizerName}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Users size={14} color={colors.textSecondary} />
          <Text variant="caption" color="textSecondary" style={styles.metaText}>
            {event.attendeesCount}
            {event.capacity !== null ? ` / ${event.capacity}` : ''} asistentes
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardMine: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  body: { padding: spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCategory: { flex: 1 },
  title: { marginTop: spacing.sm, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  metaText: { marginLeft: spacing.sm, flex: 1 },
});
