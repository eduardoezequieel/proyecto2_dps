import React from 'react';
import { useRouter } from 'expo-router';
import { Button, Screen, Text } from '../src/shared/components';
import { spacing } from '../src/shared/theme';

export default function NotFoundRoute(): React.ReactElement {
  const router = useRouter();
  return (
    <Screen>
      <Text variant="h1" color="textPrimary" style={{ marginBottom: spacing.sm }}>
        Ruta no encontrada
      </Text>
      <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.xl }}>
        La pantalla que buscas no existe.
      </Text>
      <Button label="Volver al inicio" onPress={() => router.replace('/(app)')} />
    </Screen>
  );
}
