'use client';

import { useEffect, useRef } from 'react';

import { ROUTES } from '@/lib/routes';
import { useAuthStore } from '@/stores/auth-store';

/** Pages where checkAuth should NOT run (no session expected). */
const SKIP_AUTH_CHECK = [
  ROUTES.subscriptionExpired,
  ROUTES.login,
  ROUTES.setPassword,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const didCheck = useRef(false);

  useEffect(() => {
    if (didCheck.current) return;
    didCheck.current = true;
    if (SKIP_AUTH_CHECK.some((p) => window.location.pathname.startsWith(p))) return;
    useAuthStore.getState().checkAuth();
  }, []);

  return <>{children}</>;
}
