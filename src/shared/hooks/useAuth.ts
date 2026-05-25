import { useAuthStore } from '../../modules/auth/stores/useAuthStore';
import type { AuthUser, AuthStatus } from '../../modules/auth/types';

interface UseAuthSnapshot {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): UseAuthSnapshot {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  return {
    user,
    status,
    isAuthenticated: user !== null,
    isLoading: status === 'loading' || status === 'authenticating',
  };
}
