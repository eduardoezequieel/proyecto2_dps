import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingSpinner } from '../src/shared/components';
import { logger } from '../src/shared/utils/logger';
import { useAuthStore } from '../src/modules/auth/stores/useAuthStore';
import { OAUTH_PENDING_KEY } from '../src/modules/auth/hooks/useGoogleAuth';
import { colors } from '../src/shared/theme';

WebBrowser.maybeCompleteAuthSession();

interface OAuthPending {
  codeVerifier: string | null;
  redirectUri: string;
  clientId: string;
}

function parsePending(raw: string | null): OAuthPending | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OAuthPending>;
    if (typeof parsed.redirectUri !== 'string' || typeof parsed.clientId !== 'string') {
      return null;
    }
    return {
      codeVerifier: typeof parsed.codeVerifier === 'string' ? parsed.codeVerifier : null,
      redirectUri: parsed.redirectUri,
      clientId: parsed.clientId,
    };
  } catch {
    return null;
  }
}

export default function OAuthRedirectRoute(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error?: string }>();

  useEffect(() => {
    const code = typeof params.code === 'string' ? params.code : null;
    if (!code) {
      router.replace('/(auth)/login');
      return;
    }

    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(OAUTH_PENDING_KEY);
        const pending = parsePending(raw);
        if (!pending) {
          router.replace('/(auth)/login');
          return;
        }
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: pending.clientId,
            code,
            redirectUri: pending.redirectUri,
            extraParams: pending.codeVerifier
              ? { code_verifier: pending.codeVerifier }
              : undefined,
          },
          { tokenEndpoint: 'https://oauth2.googleapis.com/token' },
        );
        const idToken = tokenResult.idToken;
        let signedIn = false;
        if (typeof idToken === 'string' && idToken.length > 0) {
          signedIn = await useAuthStore.getState().loginWithGoogle(idToken);
        }
        await AsyncStorage.removeItem(OAUTH_PENDING_KEY);
        router.replace(signedIn ? '/(app)' : '/(auth)/login');
      } catch (error) {
        logger.error('OAuthRedirect', 'exchange failed', { error: String(error) });
        router.replace('/(auth)/login');
      }
    })();
  }, [params.code, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LoadingSpinner label="Completando inicio de sesion..." />
    </View>
  );
}
