'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useUnreadCount } from '@/hooks/use-notifications';
import { ROUTES } from '@/lib/routes';

export function NotificationBell() {
  const { data: count } = useUnreadCount();

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link
        href={ROUTES.notifications}
        aria-label={count ? `${count} notificaciones sin leer` : 'Notificaciones'}
      >
        <Bell className="h-4 w-4" />
        {count != null && count > 0 && (
          <span
            aria-live="polite"
            className="bg-destructive type-label-sm absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-bold text-white"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
