import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarHeart } from 'lucide-react-native';
import { Screen, Text } from '../../../shared/components';
import { LoginForm } from '../components/LoginForm';
import { colors, radii, spacing } from '../../../shared/theme';

export function LoginScreen(): React.ReactElement {
  const router = useRouter();

  return (
    <Screen scroll keyboardOffset={48}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <CalendarHeart size={32} color={colors.accent} />
        </View>
        <Text variant="display" color="textPrimary" style={styles.title}>
          Eventos{'\n'}Comunitarios
        </Text>
        <Text variant="caption" color="textSecondary" style={styles.subtitle}>
          Conecta. Participa. Comunidad.
        </Text>
      </View>
      <LoginForm />
      <Pressable
        onPress={() => router.push('/(auth)/register')}
        hitSlop={12}
        style={styles.footer}
      >
        <Text variant="caption" color="textSecondary">
          No tienes cuenta?{' '}
          <Text variant="caption" color="accent">
            Registrate
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
