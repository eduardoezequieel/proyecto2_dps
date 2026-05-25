import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text } from '../../../shared/components';
import { spacing } from '../../../shared/theme';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useEventsStore } from '../stores/useEventsStore';
import { EventForm } from '../components/EventForm';
import type { EventDraft } from '../types';

export function CreateEventScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const create = useEventsStore((state) => state.create);
  const error = useEventsStore((state) => state.error);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (draft: EventDraft): Promise<void> => {
    if (!user) return;
    setLoading(true);
    const eventId = await create({
      draft,
      organizerUid: user.uid,
      organizerName: user.displayName ?? user.email ?? 'Organizador',
    });
    setLoading(false);
    if (!eventId) {
      Alert.alert('No se pudo crear el evento', error ?? 'Intenta nuevamente.');
      return;
    }
    router.replace(`/events/${eventId}`);
  };

  return (
    <Screen scroll>
      <Text variant="h1" color="textPrimary" style={{ marginBottom: spacing.lg }}>
        Nuevo evento
      </Text>
      <EventForm submitLabel="Crear evento" loading={loading} onSubmit={handleSubmit} />
    </Screen>
  );
}
