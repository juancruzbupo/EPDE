'use client';

import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/stores/auth-store';

/** Pages where checkAuth should NOT run (no session expected). */
const SKIP_AUTH_CHECK = [
  '/subscription-expired',
  '/login',
  '/set-password',
  '/forgot-password',
  '/reset-password',
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
