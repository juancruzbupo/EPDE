'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useUnreadCount } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const { data: count } = useUnreadCount();

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/notifications" aria-label="Notificaciones">
        <Bell className="h-4 w-4" />
        {count != null && count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
