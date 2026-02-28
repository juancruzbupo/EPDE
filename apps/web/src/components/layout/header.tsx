'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Menu, Sun, Moon } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { VisuallyHidden } from 'radix-ui';
import { Sidebar } from './sidebar';
import { NotificationBell } from '@/components/notification-bell';
import { useTheme } from '@/hooks/use-theme';

export function Header() {
  const { user } = useAuthStore();
  const { theme, toggle } = useTheme();

  return (
    <header className="flex h-14 items-center gap-4 border-b px-6">
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md p-1 focus-visible:ring-[3px] focus-visible:outline-none"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <VisuallyHidden.Root>
              <SheetTitle>Menú de navegación</SheetTitle>
            </VisuallyHidden.Root>
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      <span className="font-heading text-primary text-lg font-bold lg:hidden">EPDE</span>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={toggle}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md p-1.5 focus-visible:ring-[3px] focus-visible:outline-none"
          aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <NotificationBell />
        <span className="text-muted-foreground text-sm">{user?.name}</span>
      </div>
    </header>
  );
}
