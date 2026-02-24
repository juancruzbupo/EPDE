'use client';

import { useState } from 'react';
import { usePlan, useRemoveTask, useReorderTasks } from '@/hooks/use-maintenance-plans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Plus, ChevronUp, ChevronDown, Trash2, Pencil } from 'lucide-react';
import {
  TASK_PRIORITY_LABELS,
  RECURRENCE_TYPE_LABELS,
  TASK_STATUS_LABELS,
  PLAN_STATUS_LABELS,
} from '@epde/shared';
import { TaskDialog } from './task-dialog';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

interface PlanEditorProps {
  planId: string;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  UPCOMING: 'default',
  OVERDUE: 'destructive',
  COMPLETED: 'outline',
};

export function PlanEditor({ planId }: PlanEditorProps) {
  const { data: plan, isLoading } = usePlan(planId);
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
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === tasks.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{task.name}</span>
                    <Badge variant={statusColors[task.status] ?? 'outline'} className="text-xs">
                      {TASK_STATUS_LABELS[task.status] ?? task.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">{task.category.name}</Badge>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${priorityColors[task.priority] ?? ''}`}
                    >
                      {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                    </span>
                    <span className="text-muted-foreground">
                      {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
                    </span>
                    <span className="text-muted-foreground">
                      Próxima: {new Date(task.nextDueDate).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setTaskDialogOpen(true);
                    }}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTaskId(task.id)}
                    className="text-muted-foreground hover:text-destructive p-1"
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
