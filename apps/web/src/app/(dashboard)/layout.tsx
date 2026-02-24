'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder */}
      <aside className="bg-sidebar hidden w-64 border-r p-6 lg:block">
        <h2
          className="text-sidebar-primary text-xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          EPDE
        </h2>
        <nav className="mt-8 space-y-2">
          <p className="text-sidebar-foreground/60 text-sm">Dashboard</p>
        </nav>
        <div className="absolute bottom-6 left-6">
          <p className="text-sidebar-foreground text-sm">{user?.name}</p>
          <button
            onClick={logout}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground mt-1 text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
