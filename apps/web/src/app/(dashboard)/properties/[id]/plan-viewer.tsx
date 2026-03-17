'use client';

import {
  formatRelativeDate,
  PLAN_STATUS_LABELS,
  PRIORITY_VARIANT,
  PROPERTY_SECTOR_LABELS,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  TaskPriority,
  TaskStatus,
} from '@epde/shared';
import { CheckCircle, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { usePlan } from '@/hooks/use-plans';
import type { TaskPublic } from '@/lib/api/maintenance-plans';
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS, TASK_STATUS_ORDER } from '@/lib/style-maps';
import { cn } from '@/lib/utils';

import { CreateBudgetDialog } from '../../budgets/create-budget-dialog';
import { CreateServiceDialog } from '../../service-requests/create-service-dialog';
import { CompleteTaskDialog } from './complete-task-dialog';
import { TaskDetailSheet } from './task-detail-sheet';

const SHOW_SEARCH_THRESHOLD = 5;

const PRIORITY_OPTIONS: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: TaskPriority.HIGH, label: 'Alta' },
  { value: TaskPriority.MEDIUM, label: 'Media' },
  { value: TaskPriority.LOW, label: 'Baja' },
];

interface PlanViewerProps {
  planId: string;
  propertyId: string;
}

function StatusSummary({ tasks }: { tasks: TaskPublic[] }) {
  const counts = useMemo(() => {
    const map = new Map<TaskStatus, number>();
    for (const s of TASK_STATUS_ORDER) map.set(s, 0);
    for (const t of tasks) map.set(t.status, (map.get(t.status) ?? 0) + 1);
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-wrap gap-3">
      {TASK_STATUS_ORDER.map((status) => {
        const count = counts.get(status) ?? 0;
        if (count === 0) return null;
        const Icon = TASK_STATUS_ICONS[status];
        const color = TASK_STATUS_COLORS[status];
        return (
          <div key={status} className="flex items-center gap-1.5 text-sm">
            <Icon className={cn('h-4 w-4', color)} />
            <span className={cn('font-medium', color)}>{count}</span>
            <span className="text-muted-foreground">{TASK_STATUS_LABELS[status]}</span>
          </div>
        );
      })}
    </div>
  );
}

function CategorySection({
  categoryName,
  tasks,
  defaultOpen,
  onTaskClick,
  onComplete,
}: {
  categoryName: string;
  tasks: TaskPublic[];
  defaultOpen: boolean;
  onTaskClick: (task: TaskPublic) => void;
  onComplete: (task: TaskPublic) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const canComplete = (status: TaskStatus) =>
    status === TaskStatus.PENDING ||
    status === TaskStatus.UPCOMING ||
    status === TaskStatus.OVERDUE;

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
        <span className="text-sm font-medium">{categoryName}</span>
        <span className="text-muted-foreground text-sm">({tasks.length})</span>
      </button>
      {open && (
        <div className="space-y-1.5 pl-6">
          {tasks.map((task) => {
            const isOverdue = task.nextDueDate ? new Date(task.nextDueDate) < new Date() : false;

            return (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                onClick={() => onTaskClick(task)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onTaskClick(task);
                  }
                }}
                className="bg-card hover:bg-muted/40 w-full cursor-pointer rounded-lg border p-3 text-left transition-all active:opacity-60"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start gap-2">
                      <span className="text-sm leading-tight font-medium">{task.name}</span>
                      <Badge
                        variant={TASK_STATUS_VARIANT[task.status] ?? 'secondary'}
                        className="shrink-0 text-xs"
                      >
                        {TASK_STATUS_LABELS[task.status] ?? task.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <Badge
                        variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}
                        className="text-xs"
                      >
                        {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                      </Badge>
                      {task.sector && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span>{PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}</span>
                        </>
                      )}
                      <span className="text-muted-foreground/40">·</span>
                      <span>
                        {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                        {task.nextDueDate
                          ? formatRelativeDate(new Date(task.nextDueDate))
                          : 'Según detección'}
                      </span>
                    </div>
                  </div>

                  {canComplete(task.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onComplete(task);
                      }}
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      Completar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PlanViewer({ planId, propertyId }: PlanViewerProps) {
  const { data: plan, isLoading, isError, refetch } = usePlan(planId);

  const [selectedTask, setSelectedTask] = useState<TaskPublic | null>(null);
  const [completingTask, setCompletingTask] = useState<TaskPublic | null>(null);

  // Service / budget dialog state (pre-filled from task detail sheet)
  const [serviceDialogTaskId, setServiceDialogTaskId] = useState<string | null>(null);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const debouncedSearch = useDebounce(search);

  const tasks = plan?.tasks ?? [];

  const filtered = useMemo(() => {
    let result = tasks;
    if (priority !== 'all') {
      result = result.filter((t) => t.priority === priority);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.category.name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tasks, priority, debouncedSearch]);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; tasks: TaskPublic[] }>();
    for (const task of filtered) {
      const existing = map.get(task.category.id);
      if (existing) {
        existing.tasks.push(task);
      } else {
        map.set(task.category.id, { name: task.category.name, tasks: [task] });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError && !plan) {
    return (
      <ErrorState
        message="No se pudo cargar el plan"
        onRetry={refetch}
        className="justify-center py-16"
      />
    );
  }

  if (!plan) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <ClipboardList className="text-muted-foreground/50 h-8 w-8" />
              <p className="text-muted-foreground text-sm">No hay tareas en este plan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <StatusSummary tasks={tasks} />

              <div className="flex flex-wrap items-center gap-3">
                {tasks.length >= SHOW_SEARCH_THRESHOLD && (
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Buscar tarea o categoría..."
                  />
                )}
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

              {filtered.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No se encontraron tareas con esa búsqueda.
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    {filtered.length} tarea{filtered.length !== 1 ? 's' : ''}
                    {grouped.length > 1 && ` en ${grouped.length} categorías`}
                  </p>
                  {grouped.map((group) => (
                    <CategorySection
                      key={group.name}
                      categoryName={group.name}
                      tasks={group.tasks}
                      defaultOpen
                      onTaskClick={setSelectedTask}
                      onComplete={setCompletingTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDetailSheet
        open={!!selectedTask}
        onOpenChange={() => setSelectedTask(null)}
        task={selectedTask}
        planId={planId}
        onComplete={(task) => {
          setSelectedTask(null);
          setCompletingTask(task);
        }}
        onRequestService={(task) => {
          setServiceDialogTaskId(task.id);
          setSelectedTask(null);
        }}
        onRequestBudget={() => {
          setBudgetDialogOpen(true);
          setSelectedTask(null);
        }}
      />

      <CompleteTaskDialog
        open={!!completingTask}
        onOpenChange={() => setCompletingTask(null)}
        task={completingTask}
        planId={planId}
      />

      <CreateServiceDialog
        open={!!serviceDialogTaskId}
        onOpenChange={(open) => {
          if (!open) setServiceDialogTaskId(null);
        }}
        defaultPropertyId={propertyId}
        defaultTaskId={serviceDialogTaskId ?? undefined}
      />

      <CreateBudgetDialog
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        defaultPropertyId={propertyId}
      />
    </>
  );
}
