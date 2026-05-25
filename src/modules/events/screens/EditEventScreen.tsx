import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  LoadingSpinner,
  Screen,
  Text,
} from '../../../shared/components';
import { spacing } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useEventsStore } from '../stores/useEventsStore';
import { isUserOrganizer } from '../services/eventsService';
import { EventForm } from '../components/EventForm';
import type { CommunityEvent, EventDraft } from '../types';

export function EditEventScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const eventId = typeof params.id === 'string' ? params.id : null;
  const { user } = useAuth();
  const loadEventById = useEventsStore((state) => state.loadEventById);
  const update = useEventsStore((state) => state.update);
  const cached = useEventsStore((state) => (eventId ? state.byId[eventId] : undefined));
  const error = useEventsStore((state) => state.error);

  const [event, setEvent] = useState<CommunityEvent | null>(cached ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    if (cached) {
      setEvent(cached);
      return;
    }
    void (async () => {
      const fetched = await loadEventById(eventId);
      setEvent(fetched);
    })();
  }, [eventId, cached, loadEventById]);

  const isUnauthorized =
    event !== null && user !== null && !isUserOrganizer(event, user.uid);
  const isCancelled = event !== null && event.status === 'cancelled';
  const hasStarted =
    event !== null && event.startsAt.getTime() <= Date.now();

  useEffect(() => {
    if (isUnauthorized) {
      Alert.alert('Sin permisos', 'Solo el organizador puede editar este evento.');
      router.back();
      return;
    }
    if (isCancelled) {
      Alert.alert('Evento cancelado', 'No se puede editar un evento cancelado.');
      router.back();
      return;
    }
    if (hasStarted) {
      Alert.alert(
        'Evento en curso o finalizado',
        'No se puede editar un evento que ya inicio.',
      );
      router.back();
    }
  }, [isUnauthorized, isCancelled, hasStarted, router]);

  if (!event || isUnauthorized || isCancelled || hasStarted) {
    return (
      <Screen>
        <LoadingSpinner label="Cargando evento..." />
      </Screen>
    );
  }

  const initialDraft: EventDraft = {
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    category: event.category,
    capacity: event.capacity,
  };

  const handleSubmit = async (draft: EventDraft): Promise<void> => {
    setLoading(true);
    const success = await update({ eventId: event.id, draft });
    setLoading(false);
    if (!success) {
      Alert.alert('No se pudo guardar', error ?? 'Intenta nuevamente.');
      return;
    }
    router.back();
  };

  return (
    <Screen scroll>
      <Text variant="h1" color="textPrimary" style={{ marginBottom: spacing.lg }}>
        Editar evento
      </Text>
      <EventForm
        initialDraft={initialDraft}
        submitLabel="Guardar cambios"
        loading={loading}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
