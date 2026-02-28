'use client';

import { useMemo } from 'react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { NOTIFICATION_TYPE_LABELS } from '@epde/shared';
import { Bell, FileText, Wrench, Clock, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { NotificationPublic } from '@/lib/api/notifications';

const typeIcons: Record<string, typeof Bell> = {
  TASK_REMINDER: Clock,
  BUDGET_UPDATE: FileText,
  SERVICE_UPDATE: Wrench,
  SYSTEM: Bell,
};

export default function NotificationsPage() {
  const { data, isLoading, hasNextPage, fetchNextPage } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const allNotifications = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const handleClick = (notification: NotificationPublic) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        description="Centro de notificaciones"
        action={
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : allNotifications.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">No tenés notificaciones</p>
      ) : (
        <ul className="space-y-2">
          {allNotifications.map((n) => {
            const Icon = typeIcons[n.type] ?? Bell;
            return (
              <li
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => handleClick(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(n);
                  }
                }}
                className={`hover:bg-accent focus-visible:ring-ring/50 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors focus-visible:ring-[3px] focus-visible:outline-none ${
                  !n.read ? 'border-primary/20 bg-primary/5' : ''
                }`}
              >
                <div className="bg-muted mt-0.5 rounded-full p-2">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'}`}>
                      {n.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}
                    </Badge>
                    {!n.read && <span className="bg-primary h-2 w-2 rounded-full" />}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">{n.message}</p>
                  <span className="text-muted-foreground mt-1 text-xs">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </li>
            );
          })}

          {hasNextPage && (
            <li className="list-none pt-4 text-center">
              <Button variant="outline" onClick={() => fetchNextPage()}>
                Cargar más
              </Button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
