'use client';

import { LogOut, Menu, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VisuallyHidden } from 'radix-ui';
import { useEffect, useState } from 'react';

import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/auth-store';

import { Sidebar } from './sidebar';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Logout API may fail — local cleanup already done by auth store
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b px-4 sm:px-6">
      <div className="lg:hidden">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md p-2 focus-visible:ring-[3px] focus-visible:outline-none"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <VisuallyHidden.Root>
              <SheetTitle>Menú de navegación</SheetTitle>
            </VisuallyHidden.Root>
            <Sidebar hideCollapse className="h-full" />
          </SheetContent>
        </Sheet>
      </div>

      <span className="font-heading text-primary text-lg font-bold lg:hidden">EPDE</span>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`Menú de usuario: ${user?.name ?? 'Mi cuenta'}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{user?.name}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
