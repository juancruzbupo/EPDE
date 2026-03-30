import { TASK_STATUS_LABELS, TaskStatus } from '@epde/shared';
import React, { useMemo } from 'react';

import type { TaskPublic } from '@/lib/api/maintenance-plans';
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS, TASK_STATUS_ORDER } from '@/lib/style-maps';
import { cn } from '@/lib/utils';

interface StatusSummaryProps {
  tasks: TaskPublic[];
}

export const StatusSummary = React.memo(function StatusSummary({ tasks }: StatusSummaryProps) {
  const counts = useMemo(() => {
    const map = new Map<TaskStatus, number>();
    for (const s of TASK_STATUS_ORDER) map.set(s, 0);
    for (const t of tasks) map.set(t.status, (map.get(t.status) ?? 0) + 1);
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-wrap gap-3">
      {TASK_STATUS_ORDER.map((status) => {
        const count = counts.get(status) ?? 0;
        if (count === 0) return null;
        const Icon = TASK_STATUS_ICONS[status];
        const color = TASK_STATUS_COLORS[status];
        return (
          <div key={status} className="flex items-center gap-1.5 text-sm">
            <Icon className={cn('h-4 w-4', color)} />
            <span className={cn('font-medium', color)}>{count}</span>
            <span className="text-muted-foreground">{TASK_STATUS_LABELS[status]}</span>
          </div>
        );
      })}
    </div>
  );
});
