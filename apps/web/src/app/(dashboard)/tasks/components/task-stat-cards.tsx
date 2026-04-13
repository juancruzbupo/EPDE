import { TASK_STATUS_LABELS, TaskStatus } from '@epde/shared';
import React from 'react';

import { AnimatedNumber } from '@/components/ui/animated-number';
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
            'bg-card flex flex-1 flex-col rounded-lg border p-2.5 text-left transition-all sm:p-3',
            active ? 'ring-primary ring-2' : 'hover:bg-muted/40',
          )}
        >
          <div className="flex items-center gap-1.5">
            <Icon className={cn('h-4 w-4 shrink-0', color)} aria-hidden="true" />
            <span className={cn('text-xl leading-none font-bold tabular-nums', color)}>
              <AnimatedNumber value={count} />
            </span>
            <span className={cn('type-body-sm truncate', color)}>{TASK_STATUS_LABELS[status]}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
            {TASK_STATUS_HINTS[status]}
          </p>
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
      className="bg-card flex flex-1 flex-col rounded-lg border p-2.5 sm:p-3"
    >
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-5 w-8" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-1 h-3 w-full" />
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
      <div className="mb-4 grid grid-cols-3 gap-2">
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
