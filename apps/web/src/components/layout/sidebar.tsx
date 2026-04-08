'use client';

import { UserRole } from '@epde/shared';
import {
  CheckSquare,
  ChevronsLeft,
  ChevronsRight,
  FileEdit,
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  LayoutTemplate,
  Tags,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const adminNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/clients', icon: Users },
  { label: 'Propiedades', href: '/properties', icon: Home },
  { label: 'Tareas', href: '/tasks', icon: CheckSquare },
  { label: 'Presupuestos', href: '/budgets', icon: FileText },
  { label: 'Servicios', href: '/service-requests', icon: Wrench },
  { label: 'Categorías', href: '/categories', icon: Tags },
  { label: 'Plantillas', href: '/templates', icon: LayoutTemplate },
  { label: 'Landing', href: '/landing-settings', icon: FileEdit },
];

/** Client order: Tareas promoted to #2 (most used action).
 * Notificaciones omitted — accessible via bell icon in header. */
const clientNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tareas', href: '/tasks', icon: CheckSquare },
  { label: 'Propiedades', href: '/properties', icon: Home },
  { label: 'Presupuestos', href: '/budgets', icon: FileText },
  { label: 'Servicios', href: '/service-requests', icon: Wrench },
  { label: 'Guía de uso', href: '/guia', icon: HelpCircle },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const isAdmin = user?.role === UserRole.ADMIN;
  const filteredItems = isAdmin ? adminNavItems : clientNavItems;

  return (
    <aside
      className={cn(
        'bg-sidebar flex flex-col border-r transition-all duration-200 motion-reduce:transition-none',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className="font-heading text-sidebar-primary text-xl font-bold">
          {collapsed ? 'E' : 'EPDE'}
        </h2>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground rounded p-1 transition-colors"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav
        data-tour="sidebar-nav"
        aria-label="Navegación principal"
        className="flex-1 space-y-1 overflow-y-auto px-2"
      >
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center rounded-md text-sm font-medium transition-all duration-200 motion-reduce:transition-none',
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              {isActive && (
                <span className="bg-sidebar-primary absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200 motion-reduce:transition-none" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
