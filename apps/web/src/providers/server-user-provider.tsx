'use client';

import type { UserRole } from '@epde/shared';
import { createContext, useContext } from 'react';

interface ServerUserContext {
  role: UserRole;
}

const Ctx = createContext<ServerUserContext | null>(null);

export function ServerUserProvider({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ role }}>{children}</Ctx.Provider>;
}

/** Returns the server-decoded user role (available immediately, no API call needed). */
export function useServerUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useServerUser must be used within ServerUserProvider');
  return ctx;
}
