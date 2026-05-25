import React from 'react';
import { Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing } from '../../src/shared/theme';

export default function EventsLayout(): React.ReactElement {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { color: colors.textPrimary },
        contentStyle: { backgroundColor: colors.background },
        headerLeft: () => (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={({ pressed }) => ({
              paddingRight: spacing.sm,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>
        ),
      }}
    />
  );
}
