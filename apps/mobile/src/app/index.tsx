import { Redirect } from 'expo-router';

import { ROUTES } from '@/lib/routes';
import { useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Redirect href={ROUTES.tabs} />;
  }

  return <Redirect href={ROUTES.login} />;
}
