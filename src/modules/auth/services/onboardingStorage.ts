import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleError } from '../../../shared/utils/errorHandler';

const SCOPE = 'onboardingStorage';
const STORAGE_PREFIX = '@geventos/onboarding-completed/';

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}${uid}`;
}

export async function hasCompletedOnboarding(uid: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    return raw === '1';
  } catch (error) {
    handleError(error, SCOPE);
    return true;
  }
}

export async function markOnboardingCompleted(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(uid), '1');
  } catch (error) {
    handleError(error, SCOPE);
  }
}
