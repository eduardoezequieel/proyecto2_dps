import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radii, spacing } from '../theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Chip({
  label,
  selected,
  onPress,
  style,
  accessibilityLabel,
}: ChipProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && onPress && styles.pressed,
        style,
      ]}
    >
      <Text
        variant="caption"
        color={selected ? 'onAccent' : 'textSecondary'}
        style={styles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.75 },
  label: { fontWeight: '600' },
});
