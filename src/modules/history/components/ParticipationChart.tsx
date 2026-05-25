import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';
import { EVENT_CATEGORY_LABELS, type EventCategory } from '../../events/types';

interface ParticipationChartProps {
  data: Record<EventCategory, number>;
}

export function ParticipationChart({ data }: ParticipationChartProps): React.ReactElement {
  const entries: Array<[EventCategory, number]> = (
    Object.entries(data) as Array<[EventCategory, number]>
  ).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((acc, [, value]) => Math.max(acc, value), 0);

  if (max === 0) {
    return (
      <Text variant="caption" color="textMuted">
        Aun no hay datos de participacion.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map(([category, value]) => {
        const ratio = max === 0 ? 0 : value / max;
        const widthPercent = `${Math.max(2, ratio * 100)}%` as const;
        return (
          <View key={category} style={styles.row}>
            <Text variant="caption" color="textSecondary" style={styles.label}>
              {EVENT_CATEGORY_LABELS[category]}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: widthPercent }]} />
            </View>
            <Text variant="caption" color="textPrimary" style={styles.value}>
              {value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: { width: 100 },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  barFill: { height: 4, backgroundColor: colors.accent },
  value: { width: 24, textAlign: 'right' },
});
