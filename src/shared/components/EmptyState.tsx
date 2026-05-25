import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { spacing } from '../theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text variant="h2" color="textPrimary" style={styles.title}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="textSecondary" style={styles.message}>
          {message}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  title: { textAlign: 'center', marginBottom: spacing.sm },
  message: { textAlign: 'center' },
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
