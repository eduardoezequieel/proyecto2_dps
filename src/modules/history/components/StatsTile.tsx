import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/components';
import { colors, spacing, radii } from '../../../shared/theme';

interface StatsTileProps {
  label: string;
  value: string;
}

export function StatsTile({ label, value }: StatsTileProps): React.ReactElement {
  return (
    <View style={styles.tile}>
      <Text variant="display" color="textPrimary">
        {value}
      </Text>
      <Text variant="label" color="textSecondary" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.subtle,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-start',
  },
  label: { marginTop: spacing.xs },
});
