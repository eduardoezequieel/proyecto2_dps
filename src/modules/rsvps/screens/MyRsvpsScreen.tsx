import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTabBarHeight } from '../../../shared/hooks/useTabBarHeight';
import { Calendar } from 'lucide-react-native';
import {
  EmptyState,
  LoadingSpinner,
  Screen,
  Text,
} from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';
import { formatDateTime } from '../../../shared/utils/formatters';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useRsvpsStore } from '../stores/useRsvpsStore';
import { RsvpStatusBadge } from '../components/RsvpStatusBadge';
import type { Rsvp } from '../types';

export function MyRsvpsScreen(): React.ReactElement {
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();
  const { user } = useAuth();
  const rsvps = useRsvpsStore((state) => state.myRsvps);
  const loading = useRsvpsStore((state) => state.loadingMyRsvps);
  const subscribe = useRsvpsStore((state) => state.subscribeMyRsvps);
  const unsubscribe = useRsvpsStore((state) => state.unsubscribeMyRsvps);

  useEffect(() => {
    if (!user) return;
    subscribe(user.uid);
    return () => unsubscribe();
  }, [user, subscribe, unsubscribe]);

  const renderItem = ({ item }: { item: Rsvp }): React.ReactElement => (
    <Pressable
      onPress={() => router.push(`/events/${item.eventId}`)}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={styles.itemHeader}>
        <Text variant="bodyBold" color="textPrimary">
          {item.eventTitle}
        </Text>
        <RsvpStatusBadge status={item.status} />
      </View>
      <View style={styles.row}>
        <Calendar size={14} color={colors.textSecondary} />
        <Text variant="caption" color="textSecondary" style={styles.meta}>
          Respondiste el {formatDateTime(item.respondedAt)}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text variant="h1" color="textPrimary">
          Mis asistencias
        </Text>
        <Text variant="caption" color="textSecondary">
          Eventos a los que has respondido.
        </Text>
      </View>
      {loading && rsvps.length === 0 ? (
        <LoadingSpinner label="Cargando..." />
      ) : rsvps.length === 0 ? (
        <EmptyState
          title="No tienes asistencias"
          message="Confirma asistencia a un evento desde el listado."
        />
      ) : (
        <FlatList
          data={rsvps}
          keyExtractor={(item) => item.eventId}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + spacing.lg }]}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg },
  item: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  meta: { marginLeft: spacing.sm },
  pressed: { opacity: 0.6 },
});
