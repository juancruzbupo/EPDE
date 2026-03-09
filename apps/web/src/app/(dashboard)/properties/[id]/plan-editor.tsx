'use client';

import {
  PLAN_STATUS_LABELS,
  PRIORITY_VARIANT,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
} from '@epde/shared';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlan } from '@/hooks/use-plans';
import { useRemoveTask, useReorderTasks } from '@/hooks/use-task-operations';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

import { TaskDialog } from './task-dialog';

interface PlanEditorProps {
  planId: string;
}

export function PlanEditor({ planId }: PlanEditorProps) {
  const { data: plan, isLoading, isError, refetch } = usePlan(planId);
  const removeTask = useRemoveTask();
  const reorderTasks = useReorderTasks();

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskPublic | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
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

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newTasks = [...tasks];
    const temp = newTasks[index - 1]!;
    newTasks[index - 1] = newTasks[index]!;
    newTasks[index] = temp;
    reorderTasks.mutate({
      planId,
      tasks: newTasks.map((t, i) => ({ id: t.id, order: i })),
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === tasks.length - 1) return;
    const newTasks = [...tasks];
    const temp = newTasks[index]!;
    newTasks[index] = newTasks[index + 1]!;
    newTasks[index + 1] = temp;
    reorderTasks.mutate({
      planId,
      tasks: newTasks.map((t, i) => ({ id: t.id, order: i })),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <Badge variant="outline" className="mt-1">
            {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setTaskDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Tarea
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No hay tareas en este plan. Agregá una para comenzar.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded focus-visible:ring-[3px] focus-visible:outline-none disabled:opacity-30"
                    aria-label="Mover arriba"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === tasks.length - 1}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded focus-visible:ring-[3px] focus-visible:outline-none disabled:opacity-30"
                    aria-label="Mover abajo"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.name}</span>
                    <Badge
                      variant={TASK_STATUS_VARIANT[task.status] ?? 'outline'}
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
                    <span className="text-muted-foreground">
                      {task.nextDueDate
                        ? `Próxima: ${new Date(task.nextDueDate).toLocaleDateString('es-AR')}`
                        : 'Según detección'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setTaskDialogOpen(true);
                    }}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                    aria-label="Editar tarea"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTaskId(task.id)}
                    className="text-muted-foreground hover:text-destructive focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                    aria-label="Eliminar tarea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        planId={planId}
        task={editingTask}
      />

      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={() => setDeleteTaskId(null)}
        title="Eliminar tarea"
        description="¿Estás seguro de que querés eliminar esta tarea?"
        onConfirm={() => {
          if (deleteTaskId) {
            removeTask.mutate(
              { planId, taskId: deleteTaskId },
              { onSuccess: () => setDeleteTaskId(null) },
            );
          }
        }}
        isLoading={removeTask.isPending}
      />
    </Card>
  );
}
