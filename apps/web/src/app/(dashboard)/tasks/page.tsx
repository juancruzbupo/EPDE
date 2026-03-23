'use client';

import type { TaskListItem, TaskPublic } from '@epde/shared';
import type { PropertySector } from '@epde/shared';
import {
  formatRelativeDate,
  PRIORITY_VARIANT,
  PROPERTY_SECTOR_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TaskPriority,
  TaskStatus,
} from '@epde/shared';
import { Calendar, CheckSquare, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { SearchableFilterSelect } from '@/components/searchable-filter-select';
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
import { CreateServiceDialog } from '../service-requests/create-service-dialog';

const INITIAL_VISIBLE = 15;
const LOAD_MORE_COUNT = 20;

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: TaskPriority.HIGH, label: 'Alta' },
  { value: TaskPriority.MEDIUM, label: 'Media' },
  { value: TaskPriority.LOW, label: 'Baja' },
];

const SECTOR_OPTIONS: { value: PropertySector | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...(Object.keys(PROPERTY_SECTOR_LABELS) as PropertySector[]).map((value) => ({
    value,
    label: PROPERTY_SECTOR_LABELS[value],
  })),
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
      <Icon className={cn('h-5 w-5 shrink-0', color)} aria-hidden="true" />
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
      className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 text-left transition-all active:opacity-60"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="text-sm leading-tight font-medium">{task.name}</span>
        <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'} className="text-xs">
          {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
        </Badge>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <span>{task.category.name}</span>
        {task.sector && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span>{PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}</span>
          </>
        )}
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {task.maintenancePlan.property.address}, {task.maintenancePlan.property.city}
        </span>
        {task.nextDueDate && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
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
        <span className="text-sm font-medium">{TASK_STATUS_LABELS[status]}</span>
        <span className="text-muted-foreground text-sm">({tasks.length})</span>
      </button>
      {open && (
        <div className="space-y-1.5 pl-6">
          {visibleTasks.map((task) => (
            <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
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

export default function TasksPage() {
  useEffect(() => {
    document.title = 'Tareas | EPDE';
  }, []);

  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const [sectorFilter, setSectorFilter] = useState<PropertySector | 'all'>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<TaskStatus | null>(null);
  const debouncedSearch = useDebounce(search);

  // Task detail sheet state
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);
  const [completingTask, setCompletingTask] = useState<TaskPublic | null>(null);

  // Service / budget dialog state (pre-filled from task detail sheet)
  const [serviceDialogTask, setServiceDialogTask] = useState<{
    propertyId: string;
    taskId: string;
    title: string;
    description: string;
  } | null>(null);
  const searchParams = useSearchParams();
  const { data: tasks, isLoading, isError, refetch } = useAllTasks();

  // Auto-open task detail when navigating with ?taskId=xxx (e.g. from dashboard ActionList)
  const handledTaskId = useRef<string | null>(null);
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId && tasks && taskId !== handledTaskId.current) {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        setSelectedTask(found);
        handledTaskId.current = taskId;
      }
    }
  }, [searchParams, tasks]);

  // Fetch full task detail when a task is selected
  const { data: taskDetail } = useTaskDetail(
    selectedTask?.maintenancePlan.id ?? '',
    selectedTask?.id ?? '',
  );

  const propertyOptions = useMemo(() => {
    if (!tasks) return [];
    const seen = new Map<string, string>();
    for (const t of tasks) {
      const p = t.maintenancePlan.property;
      if (!seen.has(p.id)) seen.set(p.id, p.address);
    }
    return [...seen.entries()].map(([id, address]) => ({ value: id, label: address }));
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    let result = tasks;

    if (propertyFilter !== 'all') {
      result = result.filter((t) => t.maintenancePlan.property.id === propertyFilter);
    }

    if (priority !== 'all') {
      result = result.filter((t) => t.priority === priority);
    }

    if (sectorFilter !== 'all') {
      result = result.filter((t) => t.sector === sectorFilter);
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
  }, [tasks, propertyFilter, priority, sectorFilter, debouncedSearch]);

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

      {/* Stat cards — always visible, skeleton during loading */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {TASK_STATUS_ORDER.map((status) =>
          isLoading || !tasks ? (
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
          ) : (
            <StatCard
              key={status}
              status={status}
              count={grouped.get(status)?.length ?? 0}
              active={activeStatus === status}
              onClick={() => toggleStatus(status)}
            />
          ),
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {propertyOptions.length > 1 && (
          <SearchableFilterSelect
            value={propertyFilter}
            onChange={setPropertyFilter}
            options={propertyOptions}
            placeholder="Propiedad"
          />
        )}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar tarea, categoría o dirección..."
          className="min-w-[360px]"
        />
        <div className="flex gap-1">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              aria-pressed={priority === opt.value}
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
        <div className="flex gap-1 overflow-x-auto">
          {SECTOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              aria-pressed={sectorFilter === opt.value}
              onClick={() => setSectorFilter(opt.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                sectorFilter === opt.value
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
              defaultOpen
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
          setCompletingTask(task);
        }}
        onRequestService={() => {
          if (!selectedTask) return;
          setServiceDialogTask({
            propertyId: selectedTask.maintenancePlan.property.id,
            taskId: selectedTask.id,
            title: `Solicitud: ${selectedTask.name}`,
            description: `Tarea: ${selectedTask.name} — ${selectedTask.category.name}`,
          });
        }}
      />

      <CompleteTaskDialog
        open={!!completingTask}
        onOpenChange={() => setCompletingTask(null)}
        task={completingTask}
        planId={selectedTask?.maintenancePlan.id ?? completingTask?.maintenancePlanId ?? ''}
      />

      <CreateServiceDialog
        open={!!serviceDialogTask}
        onOpenChange={(open) => {
          if (!open) setServiceDialogTask(null);
        }}
        defaultPropertyId={serviceDialogTask?.propertyId}
        defaultTaskId={serviceDialogTask?.taskId}
        defaultTitle={serviceDialogTask?.title}
        defaultDescription={serviceDialogTask?.description}
      />
    </PageTransition>
  );
}
