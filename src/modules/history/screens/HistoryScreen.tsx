import React, { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTabBarHeight } from '../../../shared/hooks/useTabBarHeight';
import {
  Divider,
  EmptyState,
  LoadingSpinner,
  Screen,
  Text,
} from '../../../shared/components';
import { spacing } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useHistoryStore } from '../stores/useHistoryStore';
import { PastEventCard } from '../components/PastEventCard';
import { ParticipationChart } from '../components/ParticipationChart';
import { StatsTile } from '../components/StatsTile';
import type { CommunityEvent } from '../../events/types';

export function HistoryScreen(): React.ReactElement {
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();
  const { user } = useAuth();
  const past = useHistoryStore((state) => state.userPastEvents);
  const loadingPast = useHistoryStore((state) => state.loadingUserPastEvents);
  const loadUserPastEvents = useHistoryStore((state) => state.loadUserPastEvents);

  const userStats = useHistoryStore((state) => state.userStats);
  const loadingStats = useHistoryStore((state) => state.loadingUserStats);
  const loadUserStats = useHistoryStore((state) => state.loadUserStats);

  useEffect(() => {
    if (!user) return;
    void loadUserPastEvents(user.uid);
  }, [user, loadUserPastEvents]);

  useEffect(() => {
    if (!user) return;
    void loadUserStats(user.uid);
  }, [user, loadUserStats]);

  const renderItem = ({ item }: { item: CommunityEvent }): React.ReactElement => (
    <PastEventCard event={item} onPress={() => router.push(`/events/${item.id}`)} />
  );

  const header = (
    <View style={styles.headerWrapper}>
      <Text variant="h1" color="textPrimary">
        Historial
      </Text>
      <Text variant="caption" color="textSecondary">
        Eventos pasados y tu participacion.
      </Text>
      {loadingStats ? (
        <LoadingSpinner size="small" />
      ) : userStats ? (
        <>
          <View style={styles.tilesRow}>
            <StatsTile label="Asistidos" value={String(userStats.totalEventsAttended)} />
            <View style={{ width: spacing.md }} />
            <StatsTile label="Creados" value={String(userStats.totalEventsCreated)} />
          </View>
          <View style={styles.tilesRow}>
            <StatsTile label="Comentarios" value={String(userStats.totalComments)} />
            <View style={{ width: spacing.md }} />
            <StatsTile
              label="Rating de mis eventos"
              value={
                userStats.averageRatingReceived !== null
                  ? userStats.averageRatingReceived.toFixed(1)
                  : '--'
              }
            />
          </View>
          <Divider spacing="md" />
          <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
            Participacion por categoria
          </Text>
          <ParticipationChart data={userStats.participationByCategory} />
        </>
      ) : null}
      <Divider spacing="md" />
      <Text variant="label" color="textSecondary" style={styles.sectionLabel}>
        Eventos pasados
      </Text>
    </View>
  );

  return (
    <Screen padded={false}>
      {loadingPast && past.length === 0 ? (
        <>
          {header}
          <LoadingSpinner label="Cargando..." />
        </>
      ) : past.length === 0 ? (
        <FlatList
          data={[]}
          keyExtractor={(item: CommunityEvent) => item.id}
          renderItem={() => null}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState title="Sin eventos pasados" message="Cuando termine un evento, lo veras aqui." />
          }
        />
      ) : (
        <FlatList
          data={past}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + spacing.lg }]}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrapper: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tilesRow: { flexDirection: 'row', marginTop: spacing.md },
  list: { paddingHorizontal: spacing.lg },
  sectionLabel: { marginBottom: spacing.sm },
});
