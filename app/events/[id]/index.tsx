import React from 'react';
import { Stack } from 'expo-router';
import { EventDetailScreen } from '../../../src/modules/events/screens/EventDetailScreen';

export default function EventDetailRoute(): React.ReactElement {
  return (
    <>
      <Stack.Screen options={{ title: 'Detalle' }} />
      <EventDetailScreen />
    </>
  );
}
