'use client';

import type { PropertySector } from '@epde/shared';
import {
  formatRelativeDate,
  PLAN_STATUS_LABELS,
  PROPERTY_SECTOR_LABELS,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  TaskPriority,
  TaskStatus,
} from '@epde/shared';
import { CheckCircle, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { PlanViewerTour } from '@/components/onboarding-tour';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { usePlan } from '@/hooks/use-plans';
import type { TaskPublic } from '@/lib/api/maintenance-plans';
import { TASK_STATUS_COLORS, TASK_STATUS_ICONS, TASK_STATUS_ORDER } from '@/lib/style-maps';
import { cn } from '@/lib/utils';

import { CreateServiceDialog } from '../../service-requests/create-service-dialog';
import { CompleteTaskDialog } from './complete-task-dialog';
import { PlanFilters } from './plan-filters';
import { TaskDetailSheet } from './task-detail-sheet';

const SHOW_SEARCH_THRESHOLD = 5;

interface PlanViewerProps {
  planId: string;
  propertyId: string;
  /** When set, auto-opens the task detail sheet for this task ID on mount. */
  highlightTaskId?: string | null;
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
                className={`bg-card hover:bg-muted/40 hover:border-border/80 flex w-full cursor-pointer flex-col items-stretch gap-3 rounded-lg border p-3 text-left shadow-xs transition-all active:opacity-60 sm:flex-row sm:items-center sm:gap-4 ${
                  isOverdue ? 'border-l-destructive border-l-4' : ''
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Title + status badge — inline so badge stays with last word */}
                  <p className="text-sm leading-snug font-medium">
                    {task.name}{' '}
                    <Badge
                      variant={TASK_STATUS_VARIANT[task.status] ?? 'secondary'}
                      className="relative top-[-1px] ml-0.5 inline-flex text-xs"
                    >
                      {TASK_STATUS_LABELS[task.status] ?? task.status}
                    </Badge>
                  </p>

                  {/* Metadata — plain text flow */}
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                    {task.sector && ` · ${PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}`}
                    {` · ${RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}`}
                    {task.nextDueDate && (
                      <>
                        {' · '}
                        <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                          {formatRelativeDate(new Date(task.nextDueDate))}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Action button — right-aligned on desktop, full width on mobile */}
                {canComplete(task.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PlanViewer({ planId, propertyId, highlightTaskId }: PlanViewerProps) {
  const { data: plan, isLoading, isError, refetch } = usePlan(planId);

  const [selectedTask, setSelectedTask] = useState<TaskPublic | null>(null);

  // Auto-open task detail when navigating from problems section
  const highlightedRef = useRef<string | null>(null);
  useEffect(() => {
    if (highlightTaskId && plan && highlightTaskId !== highlightedRef.current) {
      highlightedRef.current = highlightTaskId;
      const task = (plan.tasks ?? []).find((t: TaskPublic) => t.id === highlightTaskId);
      if (task) setSelectedTask(task);
    }
  }, [highlightTaskId, plan]);
  const [completingTask, setCompletingTask] = useState<TaskPublic | null>(null);

  // Service / budget dialog state (pre-filled from task detail sheet)
  const [serviceDialogTask, setServiceDialogTask] = useState<{
    taskId: string;
    title: string;
    description: string;
  } | null>(null);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
  const [sectorFilter, setSectorFilter] = useState<PropertySector | 'all'>('all');
  const debouncedSearch = useDebounce(search);

  const tasks = useMemo(() => plan?.tasks ?? [], [plan?.tasks]);

  const filtered = useMemo(() => {
    let result = tasks;
    if (priority !== 'all') {
      result = result.filter((t) => t.priority === priority);
    }
    if (sectorFilter !== 'all') {
      result = result.filter((t) => t.sector === sectorFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.category.name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tasks, priority, sectorFilter, debouncedSearch]);

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
    // Sort tasks within each category by riskScore (highest first)
    for (const group of map.values()) {
      group.tasks.sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
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
      <PlanViewerTour />
      <Card>
        <CardHeader>
          <div>
            <CardTitle data-tour="plan-title" className="text-lg">
              {plan.name}
            </CardTitle>
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
              <div data-tour="plan-status-summary">
                <StatusSummary tasks={tasks} />
              </div>

              <PlanFilters
                search={search}
                onSearchChange={setSearch}
                showSearch={tasks.length >= SHOW_SEARCH_THRESHOLD}
                priority={priority}
                onPriorityChange={setPriority}
                sectorFilter={sectorFilter}
                onSectorChange={setSectorFilter}
              />

              {filtered.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No se encontraron tareas con esa búsqueda.
                </p>
              ) : (
                <div className="space-y-4" data-tour="plan-tasks">
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
          setServiceDialogTask({
            taskId: task.id,
            title: `Solicitud: ${task.name}`,
            description: `Tarea: ${task.name} — ${task.category?.name ?? ''}`,
          });
        }}
      />

      <CompleteTaskDialog
        open={!!completingTask}
        onOpenChange={() => setCompletingTask(null)}
        task={completingTask}
        planId={planId}
        onProblemDetected={(info) => {
          setServiceDialogTask({
            taskId: info.taskId,
            title: `Solicitud: ${info.taskName}`,
            description: `Problema detectado en: ${info.taskName}`,
          });
        }}
      />

      <CreateServiceDialog
        open={!!serviceDialogTask}
        onOpenChange={(open) => {
          if (!open) setServiceDialogTask(null);
        }}
        defaultPropertyId={propertyId}
        defaultTaskId={serviceDialogTask?.taskId}
        defaultTitle={serviceDialogTask?.title}
        defaultDescription={serviceDialogTask?.description}
      />
    </>
  );
}
