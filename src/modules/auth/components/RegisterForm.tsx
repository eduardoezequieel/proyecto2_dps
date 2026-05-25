import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Input, Text } from '../../../shared/components';
import {
  getConfirmPasswordError,
  getDisplayNameError,
  getEmailError,
  getPasswordStrengthError,
} from '../../../shared/utils/validators';
import { spacing } from '../../../shared/theme';
import { useAuthStore } from '../stores/useAuthStore';

interface FieldTouched {
  displayName: boolean;
  email: boolean;
  password: boolean;
  confirm: boolean;
}

export function RegisterForm(): React.ReactElement {
  const register = useAuthStore((state) => state.register);
  const storeError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const authenticating = useAuthStore((state) => state.status === 'authenticating');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState<FieldTouched>({
    displayName: false,
    email: false,
    password: false,
    confirm: false,
  });

  const nameError = touched.displayName ? getDisplayNameError(displayName) : null;
  const emailError = touched.email ? getEmailError(email) : null;
  const passwordError = touched.password ? getPasswordStrengthError(password) : null;
  const confirmError = touched.confirm ? getConfirmPasswordError(password, confirm) : null;

  const handleSubmit = async (): Promise<void> => {
    setTouched({ displayName: true, email: true, password: true, confirm: true });
    if (
      getDisplayNameError(displayName) ||
      getEmailError(email) ||
      getPasswordStrengthError(password) ||
      getConfirmPasswordError(password, confirm)
    ) {
      return;
    }
    clearError();
    await register(email, password, displayName);
  };

  return (
    <View style={styles.form}>
      <Input
        label="Nombre completo"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
        error={nameError}
        editable={!authenticating}
      />
      <Input
        label="Correo electronico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        error={emailError}
        editable={!authenticating}
      />
      <Input
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password-new"
        textContentType="newPassword"
        helper="Minimo 8 caracteres, una mayuscula, una minuscula y un numero."
        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        error={passwordError}
        editable={!authenticating}
      />
      <Input
        label="Confirma tu contraseña"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="password-new"
        onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
        error={confirmError}
        editable={!authenticating}
      />
      {storeError ? (
        <Text variant="caption" color="danger" style={styles.feedback}>
          {storeError}
        </Text>
      ) : null}
      <Button label="Crear cuenta" onPress={handleSubmit} loading={authenticating} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  feedback: { marginBottom: spacing.md },
});
