import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, spacing } from '../theme';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({
  label,
  size = 'large',
}: LoadingSpinnerProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.accent} />
      {label ? (
        <Text variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  label: { marginTop: spacing.md, textAlign: 'center' },
});
