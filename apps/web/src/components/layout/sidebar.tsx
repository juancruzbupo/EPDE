'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { LayoutDashboard, Users, Home, Tags, FileText, Wrench, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@epde/shared';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/clients', icon: Users, adminOnly: true },
  { label: 'Propiedades', href: '/properties', icon: Home },
  { label: 'Presupuestos', href: '/budgets', icon: FileText },
  { label: 'Servicios', href: '/service-requests', icon: Wrench },
  { label: 'Categorías', href: '/categories', icon: Tags, adminOnly: true },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const filteredItems = navItems.filter((item) => !item.adminOnly || user?.role === UserRole.ADMIN);

  return (
    <aside className={cn('bg-sidebar flex w-64 flex-col border-r', className)}>
      <div className="p-6">
        <h2 className="font-heading text-sidebar-primary text-xl font-bold">EPDE</h2>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-sidebar-foreground truncate text-sm font-medium">{user?.name}</p>
        <p className="text-sidebar-foreground/60 truncate text-xs">{user?.email}</p>
        <button
          onClick={logout}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground mt-2 flex items-center gap-2 text-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
