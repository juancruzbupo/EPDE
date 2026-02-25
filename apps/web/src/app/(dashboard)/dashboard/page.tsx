'use client';

import { useAuthStore } from '@/stores/auth-store';
import { UserRole } from '@epde/shared';
import { AdminDashboard } from './admin-dashboard';
import { ClientDashboard } from './client-dashboard';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;

  if (!isAdmin) {
    return <ClientDashboard userName={user?.name ?? ''} />;
  }

  return <AdminDashboard />;
}
