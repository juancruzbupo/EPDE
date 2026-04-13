import type { TaskListItem } from '@epde/shared';
import {
  formatRelativeDate,
  PRIORITY_VARIANT,
  PROPERTY_SECTOR_LABELS,
  TASK_PRIORITY_HINTS,
  TASK_PRIORITY_LABELS,
} from '@epde/shared';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export interface TaskRowProps {
  task: TaskListItem;
  onClick: () => void;
}

export const TaskRow = React.memo(function TaskRow({ task, onClick }: TaskRowProps) {
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 text-left transition-all active:opacity-60"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="text-sm leading-tight font-medium">{task.name}</span>
        <Badge
          variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}
          className="text-xs"
          title={TASK_PRIORITY_HINTS[task.priority]}
        >
          {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
        </Badge>
      </div>

      <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
        {task.category.name}
        {task.sector && ` · ${PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}`}
        {' · '}
        {task.maintenancePlan.property.address}
        {task.nextDueDate && ` · ${formatRelativeDate(new Date(task.nextDueDate))}`}
      </p>
    </button>
  );
});

export function TaskRowSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-3">
      <div className="mb-1 flex items-start justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
