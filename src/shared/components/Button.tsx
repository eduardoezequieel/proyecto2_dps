import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Text } from './Text';
import { colors, spacing, radii } from '../theme';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { container: ViewStyle; labelColor: 'onAccent' | 'textPrimary' | 'danger' }
> = {
  primary: {
    container: { backgroundColor: colors.accent, borderColor: colors.accent },
    labelColor: 'onAccent',
  },
  ghost: {
    container: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
    labelColor: 'textPrimary',
  },
  danger: {
    container: { backgroundColor: colors.surface, borderColor: colors.danger },
    labelColor: 'danger',
  },
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: ButtonProps): React.ReactElement {
  const variantStyle = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? colors.onAccent : colors.textPrimary}
          />
        ) : (
          <Text variant="bodyBold" color={variantStyle.labelColor}>
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  content: { flexDirection: 'row', alignItems: 'center' },
});
