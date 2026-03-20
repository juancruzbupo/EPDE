'use client';

import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const didCheck = useRef(false);

  useEffect(() => {
    if (didCheck.current) return;
    didCheck.current = true;
    useAuthStore.getState().checkAuth();
  }, []);

  return <>{children}</>;
}
