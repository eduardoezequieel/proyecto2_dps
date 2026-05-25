import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTabBarHeight } from '../../../shared/hooks/useTabBarHeight';
import { Plus } from 'lucide-react-native';
import {
  EmptyState,
  Input,
  LoadingSpinner,
  Screen,
  Text,
} from '../../../shared/components';
import { colors, radii, spacing } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useEventsStore } from '../stores/useEventsStore';
import { EventCard } from '../components/EventCard';
import { CategoryFilterChips } from '../components/CategoryFilterChips';
import type { CommunityEvent, EventCategory } from '../types';

export function EventsListScreen(): React.ReactElement {
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();
  const { user } = useAuth();
  const upcoming = useEventsStore((state) => state.upcoming);
  const loading = useEventsStore((state) => state.loadingUpcoming);
  const subscribe = useEventsStore((state) => state.subscribeUpcoming);
  const unsubscribe = useEventsStore((state) => state.unsubscribeUpcoming);

  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | null>(null);

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return upcoming.filter((event) => {
      if (categoryFilter && event.category !== categoryFilter) return false;
      if (query.length > 0 && !event.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [upcoming, searchText, categoryFilter]);

  const renderItem = ({ item }: { item: CommunityEvent }): React.ReactElement => (
    <EventCard
      event={item}
      onPress={() => router.push(`/events/${item.id}`)}
      isMine={user !== null && item.createdBy === user.uid}
    />
  );

  const hasFilter = searchText.trim().length > 0 || categoryFilter !== null;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="h1" color="textPrimary">
            Proximos eventos
          </Text>
          <Text variant="caption" color="textSecondary">
            Descubre lo que pasa en tu comunidad.
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
      <View style={styles.filters}>
        <Input
          placeholder="Buscar por titulo..."
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          containerStyle={styles.searchInput}
        />
        <CategoryFilterChips value={categoryFilter} onChange={setCategoryFilter} />
      </View>
      {loading && upcoming.length === 0 ? (
        <LoadingSpinner label="Cargando eventos..." />
      ) : upcoming.length === 0 ? (
        <EmptyState
          title="Aun no hay eventos"
          message="Se el primero en crear uno y abrir la convocatoria."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          message={
            hasFilter
              ? 'Ningun evento coincide con tu busqueda. Ajusta los filtros.'
              : 'Aun no hay eventos para mostrar.'
          }
        />
      ) : (
        <FlatList
          data={filtered}
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
    paddingBottom: spacing.sm,
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
  filters: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  searchInput: { marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg },
});
