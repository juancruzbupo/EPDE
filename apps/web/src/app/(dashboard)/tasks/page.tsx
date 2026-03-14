'use client';

import type { TaskListItem } from '@epde/shared';
import {
  formatRelativeDate,
  PRIORITY_VARIANT,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  TaskStatus,
} from '@epde/shared';
import { Calendar, CheckSquare, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllTasks } from '@/hooks/use-plans';

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

function TaskRow({ task, onClick }: { task: TaskListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-4 text-left transition-colors"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span className="leading-tight font-medium">{task.name}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'} className="text-xs">
            {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
          </Badge>
          <Badge variant={TASK_STATUS_VARIANT[task.status] ?? 'secondary'} className="text-xs">
            {TASK_STATUS_LABELS[task.status] ?? task.status}
          </Badge>
        </div>
      </div>

      <p className="text-muted-foreground mb-2 text-xs">{task.category.name}</p>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {task.maintenancePlan.property.address}, {task.maintenancePlan.property.city}
        </span>
        {task.nextDueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatRelativeDate(new Date(task.nextDueDate))}
          </span>
        )}
      </div>
    </button>
  );
}

function TaskRowSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="mb-1.5 flex items-start justify-between">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="mb-2 h-3 w-24" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const {
    data: tasks,
    isLoading,
    isError,
    refetch,
  } = useAllTasks(status === 'all' ? undefined : status);

  return (
    <PageTransition>
      <PageHeader
        title="Tareas"
        description="Seguimiento de todas las tareas de mantenimiento de tus propiedades."
      />

      <div className="mb-4">
        <FilterSelect
          value={status}
          onChange={(v) => setStatus(v as TaskStatus | 'all')}
          options={statusOptions}
          placeholder="Estado"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <TaskRowSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="No se pudieron cargar las tareas"
          onRetry={refetch}
          className="justify-center py-24"
        />
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Sin tareas"
          message={
            status === 'all'
              ? 'No hay tareas registradas todavía.'
              : `No hay tareas con estado "${TASK_STATUS_LABELS[status as TaskStatus] ?? status}".`
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground mb-3 text-sm">
            {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}
          </p>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => router.push(`/properties/${task.maintenancePlan.property.id}`)}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
