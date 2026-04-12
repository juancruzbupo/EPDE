import { TASK_STATUS_LABELS, TaskStatus } from '@epde/shared';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS, TASK_STATUS_ORDER } from '@/lib/style-maps';
import { cn } from '@/lib/utils';

const TASK_STATUS_HINTS: Record<TaskStatus, string> = {
  [TaskStatus.OVERDUE]: 'Tareas que pasaron su fecha de vencimiento sin completarse',
  [TaskStatus.PENDING]: 'Tareas programadas con fecha a más de 30 días',
  [TaskStatus.UPCOMING]: 'Tareas que vencen dentro de los próximos 30 días',
  [TaskStatus.COMPLETED]: 'Tareas completadas',
};

function StatCard({
  status,
  count,
  active,
  onClick,
}: {
  status: TaskStatus;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = TASK_STATUS_ICONS[status];
  const color = TASK_STATUS_COLORS[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'bg-card flex flex-1 items-center gap-3 rounded-lg border p-3 text-left transition-all',
            active ? 'ring-primary ring-2' : 'hover:bg-muted/40',
          )}
        >
          <Icon className={cn('h-5 w-5 shrink-0', color)} aria-hidden="true" />
          <div className="min-w-0">
            <p className={cn('type-number-md leading-none', color)}>{count}</p>
            <p className="type-body-sm text-muted-foreground mt-0.5">
              {TASK_STATUS_LABELS[status]}
            </p>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>{TASK_STATUS_HINTS[status]}</TooltipContent>
    </Tooltip>
  );
}

function StatCardSkeleton({ status }: { status: TaskStatus }) {
  return (
    <div
      key={status}
      role="status"
      aria-label="Cargando..."
      className="bg-card flex flex-1 items-center gap-3 rounded-lg border p-3"
    >
      <Skeleton className="h-5 w-5 rounded" />
      <div>
        <Skeleton className="h-5 w-8" />
        <Skeleton className="mt-1 h-3 w-16" />
      </div>
    </div>
  );
}

export interface TaskStatCardsProps {
  isLoading: boolean;
  statusCounts: Record<string, number>;
  activeStatus: TaskStatus | null;
  onToggleStatus: (status: TaskStatus) => void;
}

export const TaskStatCards = React.memo(function TaskStatCards({
  isLoading,
  statusCounts,
  activeStatus,
  onToggleStatus,
}: TaskStatCardsProps) {
  return (
    <TooltipProvider>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TASK_STATUS_ORDER.map((status) =>
          isLoading ? (
            <StatCardSkeleton key={status} status={status} />
          ) : (
            <StatCard
              key={status}
              status={status}
              count={statusCounts[status] ?? 0}
              active={activeStatus === status}
              onClick={() => onToggleStatus(status)}
            />
          ),
        )}
      </div>
    </TooltipProvider>
  );
});
