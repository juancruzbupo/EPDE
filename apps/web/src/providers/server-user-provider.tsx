'use client';

import type { UserRole } from '@epde/shared';
import { createContext, useContext, useMemo } from 'react';

interface ServerUserContext {
  role: UserRole;
  email: string;
}

const Ctx = createContext<ServerUserContext | null>(null);

export function ServerUserProvider({
  role,
  email,
  children,
}: {
  role: UserRole;
  email: string;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ role, email }), [role, email]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Returns the server-decoded user role (available immediately, no API call needed). */
export function useServerUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useServerUser must be used within ServerUserProvider');
  return ctx;
}
