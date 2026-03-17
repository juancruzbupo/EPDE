'use client';

import { Menu } from 'lucide-react';
import { VisuallyHidden } from 'radix-ui';

import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/auth-store';

import { Sidebar } from './sidebar';

export function Header() {
  const { user } = useAuthStore();

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
        <ThemeToggle />
        <NotificationBell />
        <span className="text-muted-foreground text-sm">{user?.name}</span>
      </div>
    </header>
  );
}
