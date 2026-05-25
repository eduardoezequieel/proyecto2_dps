import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuthStore } from '../stores/useAuthStore';

const PENDING_KEY = '@geventos/oauth-pending';

interface GoogleAuthEnv {
  webClientId: string;
  androidClientId: string;
  iosClientId: string;
}

function readGoogleEnv(): GoogleAuthEnv {
  const extra = Constants.expoConfig?.extra ?? {};
  const webClientId = typeof extra.googleWebClientId === 'string' ? extra.googleWebClientId : '';
  const androidClientId =
    typeof extra.googleAndroidClientId === 'string' && extra.googleAndroidClientId.length > 0
      ? extra.googleAndroidClientId
      : webClientId;
  const iosClientId =
    typeof extra.googleIosClientId === 'string' && extra.googleIosClientId.length > 0
      ? extra.googleIosClientId
      : webClientId;
  return { webClientId, androidClientId, iosClientId };
}

export interface UseGoogleAuthResult {
  ready: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
}

export function useGoogleAuth(): UseGoogleAuthResult {
  const env = readGoogleEnv();
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: env.webClientId,
    androidClientId: env.androidClientId,
    iosClientId: env.iosClientId,
  });

  useEffect(() => {
    if (!request) return;
    void AsyncStorage.setItem(
      PENDING_KEY,
      JSON.stringify({
        codeVerifier: request.codeVerifier ?? null,
        redirectUri: request.redirectUri,
        clientId: request.clientId,
      }),
    );
  }, [request]);

  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success') {
      setLoading(false);
      return;
    }
    const idToken = response.params.id_token;
    if (typeof idToken !== 'string' || idToken.length === 0) {
      setLoading(false);
      return;
    }
    void (async () => {
      await loginWithGoogle(idToken);
      setLoading(false);
    })();
  }, [response, loginWithGoogle]);

  const signIn = async (): Promise<void> => {
    if (!request) return;
    setLoading(true);
    await promptAsync();
  };

  return {
    ready: Boolean(request),
    loading,
    signIn,
  };
}

export const OAUTH_PENDING_KEY = PENDING_KEY;
