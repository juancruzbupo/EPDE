'use client';

import { UserRole } from '@epde/shared';
import {
  CheckSquare,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Tags,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/clients', icon: Users, adminOnly: true },
  { label: 'Propiedades', href: '/properties', icon: Home },
  { label: 'Planes', href: '/maintenance-plans', icon: ClipboardList, clientOnly: true },
  { label: 'Tareas', href: '/tasks', icon: CheckSquare },
  { label: 'Presupuestos', href: '/budgets', icon: FileText },
  { label: 'Servicios', href: '/service-requests', icon: Wrench },
  { label: 'Categorías', href: '/categories', icon: Tags, adminOnly: true },
  { label: 'Plantillas', href: '/templates', icon: LayoutTemplate, adminOnly: true },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Logout API may fail — local cleanup already done by auth store
    }
  };

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== UserRole.ADMIN) return false;
    if (item.clientOnly && user?.role !== UserRole.CLIENT) return false;
    return true;
  });

  return (
    <aside
      className={cn(
        'bg-sidebar flex flex-col border-r transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center',
          collapsed ? 'justify-center p-4' : 'justify-between p-6',
        )}
      >
        <h2 className="font-heading text-sidebar-primary text-xl font-bold">
          {collapsed ? 'E' : 'EPDE'}
        </h2>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground rounded p-1 transition-colors"
            aria-label="Colapsar menú"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Navegación principal" className="flex-1 space-y-1 overflow-y-auto px-2">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center rounded-md text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              {isActive && (
                <span className="bg-sidebar-primary absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center px-2 pb-2">
          <button
            onClick={() => setCollapsed(false)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground rounded p-1.5 transition-colors"
            aria-label="Expandir menú"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className={cn('border-t', collapsed ? 'p-2' : 'p-4')}>
        {!collapsed && (
          <>
            <p className="text-sidebar-foreground truncate text-sm font-medium">{user?.name}</p>
            <p className="text-sidebar-foreground/60 truncate text-xs">{user?.email}</p>
          </>
        )}
        <div className={cn('flex items-center', collapsed ? 'mt-0 flex-col gap-2' : 'mt-2 gap-4')}>
          <Link
            href="/profile"
            title="Perfil"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground focus-visible:ring-ring/50 flex items-center gap-2 rounded text-sm focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <User className="h-3.5 w-3.5" />
            {!collapsed && 'Perfil'}
          </Link>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground focus-visible:ring-ring/50 flex items-center gap-2 rounded text-sm focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && 'Cerrar sesión'}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
