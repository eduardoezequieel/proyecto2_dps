import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Text } from './Text';
import { colors, radii, spacing } from '../theme';

interface InputProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  label?: string;
  error?: string | null;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
  secureTextEntry?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Input({
  label,
  error,
  helper,
  containerStyle,
  secureTextEntry = false,
  accessibilityLabel,
  accessibilityHint,
  onBlur,
  onFocus,
  ...rest
}: InputProps): React.ReactElement {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);
  const isMultiline = Boolean(rest.multiline);
  const computedAccessibilityLabel = accessibilityLabel ?? label;
  const computedAccessibilityHint = accessibilityHint ?? (error ?? helper) ?? undefined;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="label" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          isMultiline && styles.inputRowMultiline,
          focused && styles.inputRowFocused,
          error ? styles.inputRowError : null,
        ]}
      >
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={computedAccessibilityLabel}
          accessibilityHint={computedAccessibilityHint}
          accessibilityState={{ disabled: rest.editable === false }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          style={[styles.input, isMultiline && styles.inputMultiline]}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            style={styles.eyeButton}
          >
            {hidden ? (
              <Eye size={18} color={colors.textSecondary} />
            ) : (
              <EyeOff size={18} color={colors.textSecondary} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="danger" style={styles.feedback}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" color="textMuted" style={styles.feedback}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: spacing.md },
  label: { marginBottom: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.accentSubtle,
    borderRadius: radii.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  inputRowMultiline: {
    alignItems: 'stretch',
    paddingVertical: spacing.sm,
    minHeight: 104,
  },
  inputRowFocused: { borderColor: colors.accent },
  inputRowError: { borderColor: colors.danger },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '400',
    padding: 0,
    minHeight: 22,
  },
  inputMultiline: {
    minHeight: 88,
  },
  eyeButton: { paddingHorizontal: spacing.sm, marginLeft: spacing.xs },
  feedback: { marginTop: spacing.xs },
});
