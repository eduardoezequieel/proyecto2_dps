import React from 'react';
import { Stack } from 'expo-router';
import { CommentsScreen } from '../../../src/modules/interactions/screens/CommentsScreen';

export default function CommentsRoute(): React.ReactElement {
  return (
    <>
      <Stack.Screen options={{ title: 'Comentarios' }} />
      <CommentsScreen />
    </>
  );
}
