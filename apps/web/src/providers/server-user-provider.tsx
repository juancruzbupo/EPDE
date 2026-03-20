'use client';

import type { UserRole } from '@epde/shared';
import { createContext, useContext } from 'react';

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
  return <Ctx.Provider value={{ role, email }}>{children}</Ctx.Provider>;
}

/** Returns the server-decoded user role (available immediately, no API call needed). */
export function useServerUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useServerUser must be used within ServerUserProvider');
  return ctx;
}
