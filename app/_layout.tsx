import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary, LoadingSpinner } from '../src/shared/components';
import { useAuthStore } from '../src/modules/auth/stores/useAuthStore';
import { colors } from '../src/shared/theme';
import { View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

function RootGuard(): React.ReactElement {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const init = useAuthStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (status !== 'ready' && status !== 'authenticating') return;
    const firstSegment = segments[0];
    const isOauthRedirect = firstSegment === 'oauthredirect';
    if (isOauthRedirect) return;

    const inAuthGroup = firstSegment === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [user, status, segments, router]);

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LoadingSpinner />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.background} />
      <ErrorBoundary>
        <RootGuard />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
