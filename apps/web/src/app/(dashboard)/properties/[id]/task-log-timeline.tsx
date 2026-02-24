'use client';

import { useTaskLogs } from '@/hooks/use-maintenance-plans';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskLogTimelineProps {
  planId: string;
  taskId: string;
}

export function TaskLogTimeline({ planId, taskId }: TaskLogTimelineProps) {
  const { data: logs, isLoading } = useTaskLogs(planId, taskId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">Sin historial de completado</p>
    );
  }

  return (
    <div className="relative space-y-4 pl-6">
      <div className="bg-border absolute bottom-0 left-2 top-0 w-px" />

      {logs.map((log) => (
        <div key={log.id} className="relative">
          <div className="bg-primary absolute -left-4 top-1.5 h-2 w-2 rounded-full" />

          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{log.user.name}</span>
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(log.completedAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>

            {log.notes && <p className="text-muted-foreground mt-1 text-sm">{log.notes}</p>}

            {log.photoUrl && (
              <div className="mt-2">
                <img
                  src={log.photoUrl}
                  alt="Foto de completado"
                  className="h-24 w-24 rounded-md object-cover"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
