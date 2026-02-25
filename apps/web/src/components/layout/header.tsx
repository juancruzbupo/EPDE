'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { VisuallyHidden } from 'radix-ui';
import { Sidebar } from './sidebar';
import { NotificationBell } from '@/components/notification-bell';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="flex h-14 items-center gap-4 border-b px-6">
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground">
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

      <h1 className="font-heading text-primary text-lg font-bold lg:hidden">EPDE</h1>

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <span className="text-muted-foreground text-sm">{user?.name}</span>
      </div>
    </header>
  );
}
