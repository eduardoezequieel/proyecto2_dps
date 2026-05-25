import React, { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useTabBarHeight } from '../../../shared/hooks/useTabBarHeight';
import {
  EmptyState,
  LoadingSpinner,
  Screen,
  Text,
} from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useEventsStore } from '../stores/useEventsStore';
import { EventCard } from '../components/EventCard';
import type { CommunityEvent } from '../types';

export function MyEventsScreen(): React.ReactElement {
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();
  const { user } = useAuth();
  const events = useEventsStore((state) => state.mine);
  const loading = useEventsStore((state) => state.loadingMine);
  const subscribe = useEventsStore((state) => state.subscribeMine);
  const unsubscribe = useEventsStore((state) => state.unsubscribeMine);

  useEffect(() => {
    if (!user) return;
    subscribe(user.uid);
    return () => unsubscribe();
  }, [user, subscribe, unsubscribe]);

  const renderItem = ({ item }: { item: CommunityEvent }): React.ReactElement => (
    <EventCard
      event={item}
      onPress={() => router.push(`/events/${item.id}`)}
      isMine
    />
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="h1" color="textPrimary">
            Mis eventos
          </Text>
          <Text variant="caption" color="textSecondary">
            Eventos que has organizado, en cualquier estado.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/events/create')}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Crear evento nuevo"
        >
          <Plus size={22} color={colors.onAccent} />
        </Pressable>
      </View>
      {loading && events.length === 0 ? (
        <LoadingSpinner label="Cargando..." />
      ) : events.length === 0 ? (
        <EmptyState
          title="Aun no organizas eventos"
          message="Crea uno y aparecera aqui sin importar su estado."
        />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + spacing.lg }]}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerText: { flex: 1, paddingRight: spacing.md },
  fab: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  fabPressed: { opacity: 0.75 },
  list: { paddingHorizontal: spacing.lg },
});
