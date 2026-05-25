import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.sm);
  return 56 + spacing.sm + bottomInset;
}
