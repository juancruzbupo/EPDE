'use client';

import { UserRole } from '@epde/shared';
import { useEffect } from 'react';

import { useServerUser } from '@/providers/server-user-provider';
import { useAuthStore } from '@/stores/auth-store';

import { AdminDashboard } from './admin-dashboard';
import { ClientDashboard } from './client-dashboard';

export default function DashboardPage() {
  useEffect(() => {
    document.title = 'Dashboard | EPDE';
  }, []);

  // role comes from server JWT (immediate, no API call)
  const { role } = useServerUser();
  // name comes from auth store (populated by checkAuth in background)
  const userName = useAuthStore((s) => s.user?.name ?? '');

  if (role === UserRole.ADMIN) {
    return <AdminDashboard />;
  }

  return <ClientDashboard userName={userName} />;
}
