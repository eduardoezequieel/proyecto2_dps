import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/components';
import { colors, spacing, radii } from '../../../shared/theme';
import { RSVP_STATUS_LABELS, type RsvpStatus } from '../types';

interface RsvpStatusBadgeProps {
  status: RsvpStatus;
}

const STATUS_BORDER: Record<RsvpStatus, string> = {
  going: colors.success,
  maybe: colors.warning,
  not_going: colors.danger,
};

export function RsvpStatusBadge({ status }: RsvpStatusBadgeProps): React.ReactElement {
  return (
    <View style={[styles.badge, { borderColor: STATUS_BORDER[status] }]}>
      <Text variant="label" color="textPrimary">
        {RSVP_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.subtle,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
