'use client';

import type { TaskListItem, TaskPublic } from '@epde/shared';
import {
  formatRelativeDate,
  PRIORITY_VARIANT,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TaskPriority,
  TaskStatus,
} from '@epde/shared';
import { Calendar, CheckSquare, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useAllTasks } from '@/hooks/use-plans';
import { useTaskDetail } from '@/hooks/use-task-operations';
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS, TASK_STATUS_ORDER } from '@/lib/style-maps';
import { cn } from '@/lib/utils';

import { CompleteTaskDialog } from '../properties/[id]/complete-task-dialog';
import { TaskDetailSheet } from '../properties/[id]/task-detail-sheet';

const INITIAL_VISIBLE = 5;

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: TaskPriority.HIGH, label: 'Alta' },
  { value: TaskPriority.MEDIUM, label: 'Media' },
  { value: TaskPriority.LOW, label: 'Baja' },
];

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
    <button
      onClick={onClick}
      className={cn(
        'bg-card flex flex-1 items-center gap-3 rounded-lg border p-3 text-left transition-all',
        active ? 'ring-primary ring-2' : 'hover:bg-muted/40',
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', color)} />
      <div className="min-w-0">
        <p className={cn('text-xl leading-none font-semibold', color)}>{count}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">{TASK_STATUS_LABELS[status]}</p>
      </div>
    </button>
  );
}

function TaskRow({ task, onClick }: { task: TaskListItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 text-left transition-colors"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="text-sm leading-tight font-medium">{task.name}</span>
        <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'} className="text-xs">
          {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
        </Badge>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <span>{task.category.name}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {task.maintenancePlan.property.address}, {task.maintenancePlan.property.city}
        </span>
        {task.nextDueDate && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatRelativeDate(new Date(task.nextDueDate))}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

function TaskRowSkeleton() {
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
  const [showAll, setShowAll] = useState(false);

  if (tasks.length === 0) return null;

  const visibleTasks = showAll ? tasks : tasks.slice(0, INITIAL_VISIBLE);
  const hasMore = tasks.length > INITIAL_VISIBLE;
  const Icon = TASK_STATUS_ICONS[status];
  const color = TASK_STATUS_COLORS[status];

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="focus-visible:ring-ring/50 mb-2 flex w-full items-center gap-2 rounded py-1 text-left focus-visible:ring-[3px] focus-visible:outline-none"
      >
        {open ? (
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4" />
        )}
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</span>
        <span className="text-muted-foreground text-sm">({tasks.length})</span>
      </button>
      {open && (
        <div className="space-y-1.5 pl-6">
          {visibleTasks.map((task) => (
            <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-primary hover:text-primary/80 w-full py-2 text-center text-sm font-medium"
            >
              Ver {tasks.length - INITIAL_VISIBLE} más
            </button>
          )}
          {hasMore && showAll && (
            <button
              onClick={() => setShowAll(false)}
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

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<TaskStatus | null>(null);
  const debouncedSearch = useDebounce(search);

  // Task detail sheet state
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);
  const [completingTask, setCompletingTask] = useState<TaskPublic | null>(null);

  const { data: tasks, isLoading, isError, refetch } = useAllTasks();

  // Fetch full task detail when a task is selected
  const { data: taskDetail } = useTaskDetail(
    selectedTask?.maintenancePlan.id ?? '',
    selectedTask?.id ?? '',
  );

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
    for (const s of TASK_STATUS_ORDER) map.set(s, []);
    for (const task of filtered) {
      map.get(task.status)?.push(task);
    }
    return map;
  }, [filtered]);

  /** Tasks to display — all or filtered by clicked stat card. */
  const displayStatuses = activeStatus ? [activeStatus] : TASK_STATUS_ORDER;

  const handleTaskClick = (task: TaskListItem) => {
    setSelectedTask(task);
  };

  const toggleStatus = (status: TaskStatus) => {
    setActiveStatus((prev) => (prev === status ? null : status));
  };

  return (
    <PageTransition>
      <PageHeader
        title="Tareas"
        description="Seguimiento de todas las tareas de mantenimiento de tus propiedades."
      />

      {/* Stat cards */}
      {!isLoading && !isError && tasks && tasks.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {TASK_STATUS_ORDER.map((status) => (
            <StatCard
              key={status}
              status={status}
              count={grouped.get(status)?.length ?? 0}
              active={activeStatus === status}
              onClick={() => toggleStatus(status)}
            />
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar tarea, categoría o dirección..."
        />
        <div className="flex gap-1">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPriority(opt.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                priority === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
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
            debouncedSearch || priority !== 'all' || activeStatus
              ? 'No se encontraron tareas con esos filtros.'
              : 'No hay tareas registradas todavía.'
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {filtered.length} tarea{filtered.length !== 1 ? 's' : ''}
          </p>
          {displayStatuses.map((status) => (
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

      {/* Task detail sheet — loads full task detail on demand */}
      <TaskDetailSheet
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
        task={taskDetail ?? null}
        planId={selectedTask?.maintenancePlan.id ?? ''}
        onComplete={(task) => {
          setSelectedTask(null);
          setCompletingTask(task);
        }}
      />

      <CompleteTaskDialog
        open={!!completingTask}
        onOpenChange={() => setCompletingTask(null)}
        task={completingTask}
        planId={selectedTask?.maintenancePlan.id ?? completingTask?.maintenancePlanId ?? ''}
      />
    </PageTransition>
  );
}
