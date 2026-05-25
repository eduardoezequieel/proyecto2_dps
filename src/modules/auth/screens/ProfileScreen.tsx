import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTabBarHeight } from '../../../shared/hooks/useTabBarHeight';
import {
  Bell,
  CalendarCheck,
  CalendarRange,
  ChevronRight,
  History,
  LogOut,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Avatar, Card, Screen, Text } from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useAuthStore } from '../stores/useAuthStore';

interface MenuRowProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
  destructive = false,
}: MenuRowProps): React.ReactElement {
  const tint = destructive ? colors.danger : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: destructive ? 'rgba(248,113,113,0.15)' : colors.accentMuted }]}>
        <Icon size={20} color={tint} />
      </View>
      <View style={styles.rowText}>
        <Text variant="bodyBold" color={destructive ? 'danger' : 'textPrimary'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {!destructive ? <ChevronRight size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

export function ProfileScreen(): React.ReactElement {
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();
  const { user } = useAuth();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = (): void => {
    Alert.alert('Cerrar sesion', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  if (!user) {
    return (
      <Screen>
        <Text variant="body" color="textSecondary">
          No has iniciado sesion.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={{ paddingBottom: tabBarHeight + spacing.lg }}>
      <View style={styles.header}>
        <Avatar name={user.displayName ?? user.email} size="xl" />
        <Text variant="h2" color="textPrimary" style={styles.name}>
          {user.displayName ?? 'Usuario'}
        </Text>
        <Text variant="caption" color="textSecondary">
          {user.email ?? '--'}
        </Text>
      </View>

      <Card padding="sm" style={styles.card}>
        <MenuRow
          icon={CalendarRange}
          title="Mis asistencias"
          subtitle="Eventos en los que participas"
          onPress={() => router.push('/(app)/my-rsvps')}
        />
        <View style={styles.divider} />
        <MenuRow
          icon={CalendarCheck}
          title="Mis eventos"
          subtitle="Eventos que organizas, en cualquier estado"
          onPress={() => router.push('/(app)/my-events')}
        />
        <View style={styles.divider} />
        <MenuRow
          icon={History}
          title="Historial"
          subtitle="Eventos pasados"
          onPress={() => router.push('/(app)/history')}
        />
        <View style={styles.divider} />
        <MenuRow
          icon={Bell}
          title="Notificaciones"
          subtitle="Abre los ajustes del sistema"
          onPress={() => void Linking.openSettings()}
        />
      </Card>

      <Card padding="sm" style={styles.card}>
        <MenuRow icon={LogOut} title="Cerrar sesion" onPress={handleLogout} destructive />
      </Card>

      <Text variant="caption" color="textMuted" style={styles.meta}>
        Metodo de inicio: {user.provider === 'google' ? 'Google' : 'Correo y contraseña'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  name: { marginTop: spacing.md },
  card: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
  },
  rowPressed: { opacity: 0.7 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowText: { flex: 1 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 36 + spacing.md + spacing.sm,
  },
  meta: { marginTop: spacing.lg, textAlign: 'center' },
});
