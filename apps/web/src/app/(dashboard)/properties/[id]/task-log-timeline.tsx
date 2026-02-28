'use client';

import { useTaskLogs } from '@/hooks/use-maintenance-plans';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TASK_RESULT_LABELS,
  CONDITION_FOUND_LABELS,
  TASK_EXECUTOR_LABELS,
  ACTION_TAKEN_LABELS,
} from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { History } from 'lucide-react';

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
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <History className="text-muted-foreground/50 h-8 w-8" />
        <p className="text-muted-foreground text-sm">Sin historial de completado</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-6">
      <div className="bg-border absolute top-0 bottom-0 left-2 w-px" />

      {logs.map((log) => (
        <div key={log.id} className="relative">
          <div className="bg-primary absolute top-2 -left-4 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-950" />

          <div className="bg-muted/30 space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{log.user.name}</span>
              <span className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(log.completedAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>

            {(log.result || log.conditionFound || log.executor || log.actionTaken) && (
              <div className="flex flex-wrap gap-1.5">
                {log.result && (
                  <Badge variant="secondary" className="text-xs">
                    {TASK_RESULT_LABELS[log.result] ?? log.result}
                  </Badge>
                )}
                {log.conditionFound && (
                  <Badge variant="outline" className="text-xs">
                    {CONDITION_FOUND_LABELS[log.conditionFound] ?? log.conditionFound}
                  </Badge>
                )}
                {log.executor && (
                  <Badge variant="outline" className="text-xs">
                    {TASK_EXECUTOR_LABELS[log.executor] ?? log.executor}
                  </Badge>
                )}
                {log.actionTaken && (
                  <Badge variant="outline" className="text-xs">
                    {ACTION_TAKEN_LABELS[log.actionTaken] ?? log.actionTaken}
                  </Badge>
                )}
              </div>
            )}

            {log.notes && (
              <p className="text-muted-foreground text-sm leading-relaxed">{log.notes}</p>
            )}

            {log.photoUrl && (
              <div className="pt-1">
                <img
                  src={log.photoUrl}
                  alt="Foto de completado"
                  className="h-24 w-24 rounded-md border object-cover"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
