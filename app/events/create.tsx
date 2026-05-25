import React from 'react';
import { Stack } from 'expo-router';
import { CreateEventScreen } from '../../src/modules/events/screens/CreateEventScreen';

export default function CreateEventRoute(): React.ReactElement {
  return (
    <>
      <Stack.Screen options={{ title: 'Nuevo evento' }} />
      <CreateEventScreen />
    </>
  );
}
