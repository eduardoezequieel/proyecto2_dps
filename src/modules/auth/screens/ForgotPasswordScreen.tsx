import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text } from '../../../shared/components';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { spacing } from '../../../shared/theme';

export function ForgotPasswordScreen(): React.ReactElement {
  const router = useRouter();

  return (
    <Screen scroll keyboardOffset={48}>
      <View style={styles.header}>
        <Text variant="display" color="textPrimary">
          recuperar
        </Text>
        <Text variant="caption" color="textSecondary" style={styles.subtitle}>
          Te enviaremos un enlace por correo.
        </Text>
      </View>
      <ForgotPasswordForm />
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
        hitSlop={12}
        style={styles.footer}
      >
        <Text variant="caption" color="textSecondary">
          Volver a{' '}
          <Text variant="caption" color="textPrimary">
            iniciar sesion
          </Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xxl, marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.xs },
  footer: { marginTop: spacing.xl, alignItems: 'center' },
});
