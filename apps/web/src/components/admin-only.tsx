'use client';

import { useAuthStore } from '@/stores/auth-store';
import { UserRole } from '@epde/shared';

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== UserRole.ADMIN) return null;
  return <>{children}</>;
}
