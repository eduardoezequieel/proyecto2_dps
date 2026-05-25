import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Input, Text } from '../../../shared/components';
import { getEmailError } from '../../../shared/utils/validators';
import { spacing } from '../../../shared/theme';
import { useAuthStore } from '../stores/useAuthStore';

export function ForgotPasswordForm(): React.ReactElement {
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset);
  const storeError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const emailError = emailTouched ? getEmailError(email) : null;

  const handleSubmit = async (): Promise<void> => {
    setEmailTouched(true);
    if (getEmailError(email)) return;
    clearError();
    setSubmitting(true);
    const success = await sendPasswordReset(email);
    setSubmitting(false);
    if (success) setSent(true);
  };

  return (
    <View style={styles.form}>
      <Text variant="caption" color="textSecondary" style={styles.help}>
        Ingresa el correo asociado a tu cuenta. Si esta registrado, recibiras un enlace para restablecer tu contraseña.
      </Text>
      <Input
        label="Correo electronico"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (sent) setSent(false);
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        onBlur={() => setEmailTouched(true)}
        error={emailError}
        editable={!submitting}
      />
      {storeError && !sent ? (
        <Text variant="caption" color="danger" style={styles.feedback}>
          {storeError}
        </Text>
      ) : null}
      {sent ? (
        <Text variant="caption" color="textPrimary" style={styles.feedback}>
          Si el correo esta registrado, recibiras un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
        </Text>
      ) : null}
      <Button
        label={sent ? 'Reenviar enlace' : 'Enviar enlace'}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  help: { marginBottom: spacing.lg },
  feedback: { marginBottom: spacing.md },
});
