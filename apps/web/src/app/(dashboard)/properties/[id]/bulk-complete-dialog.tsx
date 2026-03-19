'use client';

import type { TaskType } from '@epde/shared';
import {
  ACTION_TAKEN_LABELS,
  type CompleteTaskInput,
  completeTaskSchema,
  CONDITION_FOUND_LABELS,
  TASK_EXECUTOR_LABELS,
  TASK_RESULT_LABELS,
  TASK_TYPE_TO_DEFAULT_ACTION,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCompleteTask } from '@/hooks/use-task-operations';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

interface BulkCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskPublic[];
  planId: string;
  onDone: () => void;
}

function LabelSelect({
  label,
  labels,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  labels: Record<string, string>;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(labels).map(([val, lab]) => (
            <SelectItem key={val} value={val}>
              {lab}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function BulkCompleteDialog({
  open,
  onOpenChange,
  tasks,
  planId,
  onDone,
}: BulkCompleteDialogProps) {
  const completeTask = useCompleteTask();
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const mostCommonTaskType = tasks[0]?.taskType as TaskType | undefined;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteTaskInput>({
    resolver: zodResolver(completeTaskSchema),
    defaultValues: {
      executor: 'OWNER',
      actionTaken: mostCommonTaskType ? TASK_TYPE_TO_DEFAULT_ACTION[mostCommonTaskType] : undefined,
    },
  });

  const onSubmit = useCallback(
    async (data: CompleteTaskInput) => {
      setProgress({ current: 0, total: tasks.length });

      for (const [i, task] of tasks.entries()) {
        setProgress({ current: i + 1, total: tasks.length });
        await new Promise<void>((resolve, reject) => {
          completeTask.mutate(
            { planId, taskId: task.id, ...data },
            { onSuccess: () => resolve(), onError: (err) => reject(err) },
          );
        });
      }

      setProgress(null);
      reset();
      onOpenChange(false);
      onDone();
    },
    [tasks, planId, completeTask, reset, onOpenChange, onDone],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Completar {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Se aplicarán los mismos datos de completación a todas las tareas seleccionadas.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-2 max-h-32 overflow-y-auto rounded-md border p-2">
          <ul className="space-y-1">
            {tasks.map((t) => (
              <li key={t.id} className="text-muted-foreground text-xs">
                {t.category.name} &middot; {t.name}
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Controller
              control={control}
              name="result"
              render={({ field }) => (
                <LabelSelect
                  label="Resultado"
                  labels={TASK_RESULT_LABELS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="¿Cómo resultó?"
                  required
                />
              )}
            />
            {errors.result && (
              <p role="alert" className="text-destructive mt-1 text-sm">
                {errors.result.message}
              </p>
            )}
          </div>

          <div>
            <Controller
              control={control}
              name="conditionFound"
              render={({ field }) => (
                <LabelSelect
                  label="Condición encontrada"
                  labels={CONDITION_FOUND_LABELS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Estado general"
                  required
                />
              )}
            />
            {errors.conditionFound && (
              <p role="alert" className="text-destructive mt-1 text-sm">
                {errors.conditionFound.message}
              </p>
            )}
          </div>

          <div>
            <Controller
              control={control}
              name="executor"
              render={({ field }) => (
                <LabelSelect
                  label="¿Quién lo hizo?"
                  labels={TASK_EXECUTOR_LABELS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Ejecutor"
                  required
                />
              )}
            />
            {errors.executor && (
              <p role="alert" className="text-destructive mt-1 text-sm">
                {errors.executor.message}
              </p>
            )}
          </div>

          <div>
            <Controller
              control={control}
              name="actionTaken"
              render={({ field }) => (
                <LabelSelect
                  label="Acción realizada"
                  labels={ACTION_TAKEN_LABELS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="¿Qué se hizo?"
                  required
                />
              )}
            />
            {errors.actionTaken && (
              <p role="alert" className="text-destructive mt-1 text-sm">
                {errors.actionTaken.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              {...register('note')}
              placeholder="Describí el trabajo realizado..."
              className="resize-none"
              rows={2}
            />
          </div>

          {progress && (
            <div className="space-y-1">
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-muted-foreground text-center text-xs">
                {progress.current} de {progress.total}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={!!progress}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!!progress}>
              {progress
                ? `Completando ${progress.current}/${progress.total}...`
                : 'Completar todas'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
