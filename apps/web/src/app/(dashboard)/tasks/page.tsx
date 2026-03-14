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
import { Calendar, CheckSquare, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useAllTasks } from '@/hooks/use-plans';

/** Display order: actionable items first. */
const STATUS_ORDER: TaskStatus[] = [
  TaskStatus.OVERDUE,
  TaskStatus.PENDING,
  TaskStatus.UPCOMING,
  TaskStatus.COMPLETED,
];

const priorityOptions = [
  { value: 'all', label: 'Todas las prioridades' },
  ...Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
];

function TaskRow({ task, onClick }: { task: TaskListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-4 text-left transition-colors"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span className="leading-tight font-medium">{task.name}</span>
        <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'} className="text-xs">
          {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
        </Badge>
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

function StatusSection({
  status,
  tasks,
  defaultOpen,
  onTaskClick,
}: {
  status: TaskStatus;
  tasks: TaskListItem[];
  defaultOpen: boolean;
  onTaskClick: (task: TaskListItem) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (tasks.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="focus-visible:ring-ring/50 mb-2 flex w-full items-center gap-2 rounded py-1 text-left focus-visible:ring-[3px] focus-visible:outline-none"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Badge variant={TASK_STATUS_VARIANT[status] ?? 'secondary'}>
          {TASK_STATUS_LABELS[status]}
        </Badge>
        <span className="text-muted-foreground text-sm">{tasks.length}</span>
      </button>
      {open && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const debouncedSearch = useDebounce(search);

  const { data: tasks, isLoading, isError, refetch } = useAllTasks();

  const filtered = useMemo(() => {
    if (!tasks) return [];
    let result = tasks;

    if (priority !== 'all') {
      result = result.filter((t) => t.priority === priority);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.name.toLowerCase().includes(q) ||
          t.maintenancePlan.property.address.toLowerCase().includes(q) ||
          t.maintenancePlan.property.city.toLowerCase().includes(q),
      );
    }

    return result;
  }, [tasks, priority, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, TaskListItem[]>();
    for (const s of STATUS_ORDER) map.set(s, []);
    for (const task of filtered) {
      map.get(task.status)?.push(task);
    }
    return map;
  }, [filtered]);

  const handleTaskClick = (task: TaskListItem) => {
    router.push(`/properties/${task.maintenancePlan.property.id}`);
  };

  return (
    <PageTransition>
      <PageHeader
        title="Tareas"
        description="Seguimiento de todas las tareas de mantenimiento de tus propiedades."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar tarea, categoría o dirección..."
        />
        <FilterSelect
          value={priority}
          onChange={setPriority}
          options={priorityOptions}
          placeholder="Prioridad"
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Sin tareas"
          message={
            debouncedSearch || priority !== 'all'
              ? 'No se encontraron tareas con esos filtros.'
              : 'No hay tareas registradas todavía.'
          }
        />
      ) : (
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm">
            {filtered.length} tarea{filtered.length !== 1 ? 's' : ''}
          </p>
          {STATUS_ORDER.map((status) => (
            <StatusSection
              key={status}
              status={status}
              tasks={grouped.get(status) ?? []}
              defaultOpen={status !== TaskStatus.COMPLETED}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
