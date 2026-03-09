'use client';

import { UserRole } from '@epde/shared';

import { useAuthStore } from '@/stores/auth-store';

import { AdminDashboard } from './admin-dashboard';
import { ClientDashboard } from './client-dashboard';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return null;
  }

  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard />;
  }

  return <ClientDashboard userName={user.name ?? ''} />;
}
