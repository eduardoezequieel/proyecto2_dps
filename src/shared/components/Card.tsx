import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, type SpacingToken } from '../theme';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  variant?: CardVariant;
  padding?: SpacingToken;
  onPress?: PressableProps['onPress'];
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  default: { backgroundColor: colors.surface, borderColor: colors.border },
  elevated: { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong },
  outlined: { backgroundColor: colors.transparent, borderColor: colors.borderStrong },
};

export function Card({
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  children,
  accessibilityLabel,
  accessibilityHint,
}: CardProps): React.ReactElement {
  const base: ViewStyle = {
    ...styles.base,
    ...VARIANT_STYLES[variant],
    padding: spacing[padding],
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [base, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  pressed: { opacity: 0.85 },
});
