import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { CalendarRange, ClipboardCheck, History, UserCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/shared/theme';
import { useAuthStore } from '../../src/modules/auth/stores/useAuthStore';
import { PermissionOnboarding } from '../../src/modules/auth/components/PermissionOnboarding';
import {
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from '../../src/modules/auth/services/onboardingStorage';

export default function AppLayout(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.sm);
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void hasCompletedOnboarding(uid).then((done) => {
      if (!cancelled && !done) setShowOnboarding(true);
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const handleOnboardingClose = (): void => {
    setShowOnboarding(false);
    if (uid) void markOnboardingCompleted(uid);
  };

  return (
    <>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + spacing.sm + bottomInset,
          paddingTop: spacing.xs,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => <CalendarRange color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-rsvps"
        options={{
          title: 'Mis asistencias',
          tabBarIcon: ({ color, size }) => <ClipboardCheck color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="my-events" options={{ href: null }} />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <UserCircle2 color={color} size={size} />,
        }}
      />
    </Tabs>
      <PermissionOnboarding visible={showOnboarding} onClose={handleOnboardingClose} />
    </>
  );
}
