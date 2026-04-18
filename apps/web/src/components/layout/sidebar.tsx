'use client';

import { UserRole } from '@epde/shared';
import {
  BookOpen,
  CheckSquare,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  FileEdit,
  FileText,
  HardHat,
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

import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const adminNavItems = [
  { label: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Clientes', href: ROUTES.clients, icon: Users },
  { label: 'Propiedades', href: ROUTES.properties, icon: Home },
  { label: 'Tareas', href: ROUTES.tasks, icon: CheckSquare },
  { label: 'Presupuestos', href: ROUTES.budgets, icon: FileText },
  { label: 'Servicios', href: ROUTES.serviceRequests, icon: Wrench },
  {
    label: 'Inspecciones técnicas',
    href: ROUTES.technicalInspections,
    icon: ClipboardCheck,
  },
  { label: 'Profesionales', href: ROUTES.professionals, icon: HardHat },
  { label: 'Categorías', href: ROUTES.categories, icon: Tags },
  { label: 'Plantillas', href: ROUTES.templates, icon: LayoutTemplate },
  { label: 'Landing', href: ROUTES.landingSettings, icon: FileEdit },
];

/** Client order: Tareas promoted to #2 (most used action).
 * Notificaciones omitted — accessible via bell icon in header. */
const clientNavItems = [
  { label: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Tareas', href: ROUTES.tasks, icon: CheckSquare },
  { label: 'Propiedades', href: ROUTES.properties, icon: Home },
  { label: 'Presupuestos', href: ROUTES.budgets, icon: FileText },
  { label: 'Servicios', href: ROUTES.serviceRequests, icon: Wrench },
  {
    label: 'Inspecciones técnicas',
    href: ROUTES.technicalInspections,
    icon: ClipboardCheck,
  },
];

export function Sidebar({
  className,
  hideCollapse,
}: {
  className?: string;
  hideCollapse?: boolean;
}) {
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
        'bg-sidebar flex flex-col border-r transition-all duration-300 motion-reduce:transition-none',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <span className="font-heading text-sidebar-primary text-xl font-bold" aria-label="EPDE">
          {collapsed ? 'E' : 'EPDE'}
        </span>
        {!hideCollapse && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground rounded p-1 transition-colors"
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        )}
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
                'relative flex items-center rounded-md text-sm font-medium transition-all duration-300 motion-reduce:transition-none',
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              {isActive && (
                <span className="bg-sidebar-primary absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-300 motion-reduce:transition-none" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer — help + user info */}
      <div className="border-border space-y-1 border-t px-2 py-2">
        <Link
          href={ROUTES.guide}
          aria-label="Guía de uso"
          title={collapsed ? 'Guía de uso' : undefined}
          className={cn(
            'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground flex items-center rounded-md text-sm font-medium transition-all duration-300 motion-reduce:transition-none',
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
            pathname === ROUTES.guide && 'bg-sidebar-accent text-sidebar-accent-foreground',
          )}
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Guía de uso</span>}
        </Link>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-glossary'))}
          className={cn(
            'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground flex items-center rounded-md text-sm font-medium transition-all',
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
          )}
          aria-label="Glosario"
          title={collapsed ? 'Glosario' : undefined}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Glosario</span>}
        </button>

        {/* User info — visible when expanded */}
        {!collapsed && user && (
          <Link
            href={ROUTES.profile}
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent/50 flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
          >
            <div className="bg-sidebar-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium">
              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-sidebar-foreground/50 truncate text-xs">{user.email}</p>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
