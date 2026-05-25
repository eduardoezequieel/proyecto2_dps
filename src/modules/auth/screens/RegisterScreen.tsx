import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { Screen, Text } from '../../../shared/components';
import { RegisterForm } from '../components/RegisterForm';
import { colors, radii, spacing } from '../../../shared/theme';

export function RegisterScreen(): React.ReactElement {
  const router = useRouter();

  return (
    <Screen scroll keyboardOffset={48}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <UserPlus size={32} color={colors.accent} />
        </View>
        <Text variant="h1" color="textPrimary" style={styles.title}>
          Crea tu cuenta
        </Text>
        <Text variant="caption" color="textSecondary" style={styles.subtitle}>
          Unete a la comunidad para descubrir y crear eventos.
        </Text>
      </View>
      <RegisterForm />
      <Pressable
        onPress={() => router.replace('/(auth)/login')}
        hitSlop={12}
        style={styles.footer}
      >
        <Text variant="caption" color="textSecondary">
          Ya tienes cuenta?{' '}
          <Text variant="caption" color="accent">
            Inicia sesion
          </Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.xl, alignItems: 'center' },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { textAlign: 'center' },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
  footer: { marginTop: spacing.xl, alignItems: 'center' },
});
