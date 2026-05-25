import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, Text } from '../../../shared/components';
import { getEmailError } from '../../../shared/utils/validators';
import { colors, spacing } from '../../../shared/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { GoogleSignInButton } from './GoogleSignInButton';

interface FieldTouched {
  email: boolean;
  password: boolean;
}

export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const storeError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const authenticating = useAuthStore((state) => state.status === 'authenticating');

  const google = useGoogleAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<FieldTouched>({ email: false, password: false });

  const emailError = touched.email ? getEmailError(email) : null;
  const passwordError = touched.password && password.length === 0 ? 'Ingresa tu contraseña.' : null;

  const handleSubmit = async (): Promise<void> => {
    setTouched({ email: true, password: true });
    if (getEmailError(email) || password.length === 0) return;
    clearError();
    await login(email, password);
  };

  const disabled = authenticating || google.loading;

  return (
    <View style={styles.form}>
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
        editable={!disabled}
      />
      <Input
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        error={passwordError}
        editable={!disabled}
      />
      {storeError ? (
        <Text variant="caption" color="danger" style={styles.feedback}>
          {storeError}
        </Text>
      ) : null}
      <Button label="Iniciar sesion" onPress={handleSubmit} loading={authenticating} disabled={disabled} />
      <Pressable
        onPress={() => {
          clearError();
          router.push('/(auth)/forgot');
        }}
        hitSlop={12}
        style={styles.forgot}
      >
        <Text variant="caption" color="textSecondary">
          ¿Olvidaste tu contraseña?
        </Text>
      </Pressable>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text variant="caption" color="textMuted" style={styles.dividerLabel}>
          o continua con
        </Text>
        <View style={styles.dividerLine} />
      </View>
      <GoogleSignInButton
        onPress={() => void google.signIn()}
        loading={google.loading}
        disabled={!google.ready || authenticating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  feedback: { marginBottom: spacing.md },
  forgot: { marginTop: spacing.md, alignSelf: 'center' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { marginHorizontal: spacing.md },
});
