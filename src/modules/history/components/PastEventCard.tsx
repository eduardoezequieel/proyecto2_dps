import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Text } from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';
import { formatDate } from '../../../shared/utils/formatters';
import { EVENT_CATEGORY_LABELS, type CommunityEvent } from '../../events/types';

interface PastEventCardProps {
  event: CommunityEvent;
  onPress: () => void;
}

export function PastEventCard({ event, onPress }: PastEventCardProps): React.ReactElement {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text variant="label" color="textMuted">
        {EVENT_CATEGORY_LABELS[event.category]}
      </Text>
      <Text variant="h3" color="textPrimary" style={styles.title} numberOfLines={2}>
        {event.title}
      </Text>
      <Text variant="caption" color="textSecondary">
        {formatDate(event.startsAt)}
      </Text>
      {event.averageRating !== null ? (
        <View style={styles.row}>
          <Star size={14} color={colors.warning} fill={colors.warning} />
          <Text variant="caption" color="textSecondary" style={styles.rating}>
            {event.averageRating.toFixed(1)} ({event.ratingsCount})
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.6 },
  title: { marginTop: spacing.xs, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  rating: { marginLeft: spacing.sm },
});
