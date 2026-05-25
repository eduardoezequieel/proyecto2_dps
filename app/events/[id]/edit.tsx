import React from 'react';
import { Stack } from 'expo-router';
import { EditEventScreen } from '../../../src/modules/events/screens/EditEventScreen';

export default function EditEventRoute(): React.ReactElement {
  return (
    <>
      <Stack.Screen options={{ title: 'Editar evento' }} />
      <EditEventScreen />
    </>
  );
}
