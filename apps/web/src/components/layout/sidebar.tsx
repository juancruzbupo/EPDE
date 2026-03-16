'use client';

import { UserRole } from '@epde/shared';
import {
  CheckSquare,
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
    <aside className={cn('bg-sidebar flex w-64 flex-col border-r', className)}>
      <div className="p-6">
        <h2 className="font-heading text-sidebar-primary text-xl font-bold">EPDE</h2>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 space-y-1 overflow-y-auto px-3">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              {isActive && (
                <span className="bg-sidebar-primary absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-200" />
              )}
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-sidebar-foreground truncate text-sm font-medium">{user?.name}</p>
        <p className="text-sidebar-foreground/60 truncate text-xs">{user?.email}</p>
        <div className="mt-2 flex items-center gap-4">
          <Link
            href="/profile"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground focus-visible:ring-ring/50 flex items-center gap-2 rounded text-sm focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <User className="h-3.5 w-3.5" />
            Perfil
          </Link>
          <button
            onClick={handleLogout}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground focus-visible:ring-ring/50 flex items-center gap-2 rounded text-sm focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
