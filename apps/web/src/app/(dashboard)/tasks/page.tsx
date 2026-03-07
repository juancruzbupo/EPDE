'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAllTasks } from '@/hooks/use-plans';
import { PageHeader } from '@/components/page-header';
import { PageTransition } from '@/components/ui/page-transition';
import { FilterSelect } from '@/components/filter-select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckSquare, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TaskStatus,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  TASK_PRIORITY_LABELS,
  PRIORITY_VARIANT,
  formatRelativeDate,
} from '@epde/shared';
import type { TaskListItem } from '@epde/shared';

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: TaskStatus.OVERDUE, label: 'Vencidas' },
  { value: TaskStatus.UPCOMING, label: 'Próximas' },
  { value: TaskStatus.PENDING, label: 'Pendientes' },
  { value: TaskStatus.COMPLETED, label: 'Completadas' },
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
        <div className="flex flex-col items-center justify-center gap-2 py-24">
          <AlertTriangle className="text-destructive h-8 w-8" />
          <p className="text-muted-foreground text-sm">No se pudieron cargar las tareas</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckSquare className="text-muted-foreground/40 mb-4 h-12 w-12" />
          <h2 className="text-muted-foreground text-lg font-medium">Sin tareas</h2>
          <p className="text-muted-foreground/70 mt-1 max-w-sm text-sm">
            {status === 'all'
              ? 'No hay tareas registradas todavía.'
              : `No hay tareas con estado "${TASK_STATUS_LABELS[status as TaskStatus] ?? status}".`}
          </p>
        </div>
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
