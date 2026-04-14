import type { TaskListItem } from '@epde/shared';
import {
  formatRelativeDate,
  PRIORITY_VARIANT,
  PROPERTY_SECTOR_LABELS,
  TASK_PRIORITY_HINTS,
  TASK_PRIORITY_LABELS,
  TaskPriority,
  TaskStatus,
} from '@epde/shared';
import { CalendarClock, CheckCircle } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface TaskRowProps {
  task: TaskListItem;
  onClick: () => void;
  onComplete?: (task: TaskListItem) => void;
  onPostpone?: (task: TaskListItem) => void;
}

const COMPLETABLE: TaskStatus[] = [TaskStatus.PENDING, TaskStatus.UPCOMING, TaskStatus.OVERDUE];

export const TaskRow = React.memo(function TaskRow({
  task,
  onClick,
  onComplete,
  onPostpone,
}: TaskRowProps) {
  const isOverdue = task.nextDueDate ? new Date(task.nextDueDate) < new Date() : false;
  const canComplete = COMPLETABLE.includes(task.status);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bg-card hover:bg-muted/40 hover:border-border/80 flex w-full cursor-pointer flex-col items-stretch gap-3 rounded-lg border p-3 text-left shadow-xs transition-all active:opacity-60 sm:flex-row sm:items-center sm:gap-4 ${
        isOverdue ? 'border-l-destructive border-l-4' : ''
      }`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        {/* Title + priority badge — inline so badge stays with last word */}
        <p className="type-title-sm leading-snug">
          {task.name}{' '}
          <Badge
            variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}
            className="relative top-[-1px] ml-0.5 inline-flex text-xs"
            title={TASK_PRIORITY_HINTS[task.priority]}
          >
            {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
          </Badge>
        </p>

        {/* Metadata — plain text flow */}
        <p className="text-muted-foreground type-body-sm leading-relaxed">
          {task.category.name}
          {task.sector && ` · ${PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}`}
          {' · '}
          {task.maintenancePlan.property.address}
          {task.nextDueDate && (
            <>
              {' · '}
              <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                {formatRelativeDate(new Date(task.nextDueDate))}
              </span>
            </>
          )}
          {(task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT) && (
            <span className="italic"> · {TASK_PRIORITY_HINTS[task.priority]}</span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        {isOverdue && onPostpone && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs sm:w-auto"
            onClick={(e) => {
              e.stopPropagation();
              onPostpone(task);
            }}
            title="Posponer 7 días"
          >
            <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
            Posponer
          </Button>
        )}
        {canComplete && onComplete && (
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(task);
            }}
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Registrar inspección
          </Button>
        )}
      </div>
    </div>
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
