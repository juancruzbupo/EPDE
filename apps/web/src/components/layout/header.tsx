'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="flex h-14 items-center gap-4 border-b px-6 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <h1
        className="text-primary text-lg font-bold"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        EPDE
      </h1>

      <div className="ml-auto text-sm">
        <span className="text-muted-foreground">{user?.name}</span>
      </div>
    </header>
  );
}
