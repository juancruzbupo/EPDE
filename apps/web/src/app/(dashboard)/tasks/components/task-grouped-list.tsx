import type { TaskListItem } from '@epde/shared';
import { TASK_STATUS_LABELS, TaskStatus } from '@epde/shared';
import { CheckSquare, ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS } from '@/lib/style-maps';
import { cn } from '@/lib/utils';

import { TaskRow, TaskRowSkeleton } from './task-row';

const INITIAL_VISIBLE = 15;
const LOAD_MORE_COUNT = 20;

function StatusSection({
  status,
  tasks,
  defaultOpen,
  onTaskClick,
  onTaskComplete,
  onTaskPostpone,
}: {
  status: TaskStatus;
  tasks: TaskListItem[];
  defaultOpen: boolean;
  onTaskClick: (task: TaskListItem) => void;
  onTaskComplete?: (task: TaskListItem) => void;
  onTaskPostpone?: (task: TaskListItem) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  if (tasks.length === 0) return null;

  const visibleTasks = tasks.slice(0, visibleCount);
  const hasMore = tasks.length > visibleCount;
  const Icon = TASK_STATUS_ICONS[status];
  const color = TASK_STATUS_COLORS[status];

  return (
    <div>
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="focus-visible:ring-ring/50 mb-2 flex w-full items-center gap-2 rounded py-1 text-left focus-visible:ring-[3px] focus-visible:outline-none"
      >
        {open ? (
          <ChevronDown className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        )}
        <Icon className={cn('h-4 w-4', color)} aria-hidden="true" />
        <span className="type-title-sm">{TASK_STATUS_LABELS[status]}</span>
        <span className="text-muted-foreground type-body-md">({tasks.length})</span>
      </button>
      {open && (
        <div className="space-y-1.5 pl-6">
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onComplete={onTaskComplete}
              onPostpone={onTaskPostpone}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((c) => c + LOAD_MORE_COUNT)}
              className="text-primary hover:text-primary/80 w-full py-2 text-center text-sm font-medium"
            >
              Ver {Math.min(LOAD_MORE_COUNT, tasks.length - visibleCount)} más
            </button>
          )}
          {visibleCount > INITIAL_VISIBLE && (
            <button
              onClick={() => setVisibleCount(INITIAL_VISIBLE)}
              className="text-primary hover:text-primary/80 w-full py-2 text-center text-sm font-medium"
            >
              Ver menos
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export interface TaskGroupedListProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  filtered: TaskListItem[];
  grouped: Map<TaskStatus, TaskListItem[]>;
  displayStatuses: TaskStatus[];
  hasActiveFilters: boolean;
  onTaskClick: (task: TaskListItem) => void;
  onTaskComplete?: (task: TaskListItem) => void;
  onTaskPostpone?: (task: TaskListItem) => void;
}

export const TaskGroupedList = React.memo(function TaskGroupedList({
  isLoading,
  isError,
  onRetry,
  filtered,
  grouped,
  displayStatuses,
  hasActiveFilters,
  onTaskClick,
  onTaskComplete,
  onTaskPostpone,
}: TaskGroupedListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <TaskRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="No se pudieron cargar las tareas"
        onRetry={onRetry}
        className="justify-center py-24"
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Sin tareas"
        message={
          hasActiveFilters
            ? 'No se encontraron tareas con esos filtros.'
            : 'No hay tareas registradas todavía.'
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p
        data-tour="task-list"
        className="type-label-sm text-muted-foreground tracking-wider uppercase"
      >
        {filtered.length} tarea{filtered.length !== 1 ? 's' : ''} encontrada
        {filtered.length !== 1 ? 's' : ''}
      </p>
      {displayStatuses.map((status) => (
        <StatusSection
          key={status}
          status={status}
          tasks={grouped.get(status) ?? []}
          defaultOpen
          onTaskClick={onTaskClick}
          onTaskComplete={onTaskComplete}
          onTaskPostpone={onTaskPostpone}
        />
      ))}
    </div>
  );
});
