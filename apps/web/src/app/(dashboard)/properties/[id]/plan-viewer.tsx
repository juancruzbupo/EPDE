'use client';

import {
  PLAN_STATUS_LABELS,
  PRIORITY_VARIANT,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  TaskStatus,
} from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, ClipboardList } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { FilterSelect } from '@/components/filter-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlan } from '@/hooks/use-plans';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

import { CompleteTaskDialog } from './complete-task-dialog';
import { TaskDetailSheet } from './task-detail-sheet';

interface PlanViewerProps {
  planId: string;
}

export function PlanViewer({ planId }: PlanViewerProps) {
  const { data: plan, isLoading, isError, refetch } = usePlan(planId);

  const [selectedTask, setSelectedTask] = useState<TaskPublic | null>(null);
  const [completingTask, setCompletingTask] = useState<TaskPublic | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const categories = useMemo(() => {
    if (!plan?.tasks) return [];
    const unique = new Map<string, string>();
    plan.tasks.forEach((t) => unique.set(t.category.id, t.category.name));
    return Array.from(unique, ([value, label]) => ({ value, label }));
  }, [plan?.tasks]);

  const filteredTasks = useMemo(() => {
    if (!plan?.tasks) return [];
    return plan.tasks.filter((t) => {
      if (categoryFilter !== 'all' && t.category.id !== categoryFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [plan?.tasks, categoryFilter, statusFilter, priorityFilter]);

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

  const tasks = plan.tasks ?? [];
  const canComplete = (status: string) =>
    status === TaskStatus.PENDING ||
    status === TaskStatus.UPCOMING ||
    status === TaskStatus.OVERDUE;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              <FilterSelect
                placeholder="Categoría"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categories}
              />
              <FilterSelect
                placeholder="Estado"
                value={statusFilter}
                onChange={setStatusFilter}
                options={Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <FilterSelect
                placeholder="Prioridad"
                value={priorityFilter}
                onChange={setPriorityFilter}
                options={Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <ClipboardList className="text-muted-foreground/50 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
                {tasks.length === 0
                  ? 'No hay tareas en este plan.'
                  : 'No hay tareas que coincidan con los filtros.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const isOverdue = task.nextDueDate
                  ? new Date(task.nextDueDate) < new Date()
                  : false;
                return (
                  <div
                    key={task.id}
                    className="hover:bg-accent focus-visible:ring-ring/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTask(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedTask(task);
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{task.name}</span>
                        <Badge
                          variant={TASK_STATUS_VARIANT[task.status] ?? 'secondary'}
                          className="text-xs"
                        >
                          {TASK_STATUS_LABELS[task.status] ?? task.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline">{task.category.name}</Badge>
                        <Badge
                          variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}
                          className="text-xs"
                        >
                          {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                        </Badge>
                        <span className="text-muted-foreground">
                          {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
                        </span>
                        <span
                          className={
                            isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                          }
                        >
                          {task.nextDueDate
                            ? formatDistanceToNow(new Date(task.nextDueDate), {
                                addSuffix: true,
                                locale: es,
                              })
                            : 'Según detección'}
                        </span>
                      </div>
                    </div>

                    {canComplete(task.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompletingTask(task);
                        }}
                      >
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                        Completar
                      </Button>
                    )}
                  </div>
                );
              })}
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
      />

      <CompleteTaskDialog
        open={!!completingTask}
        onOpenChange={() => setCompletingTask(null)}
        task={completingTask}
        planId={planId}
      />
    </>
  );
}
