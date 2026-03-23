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
import { Camera, Loader2, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
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
import { useUploadFile } from '@/hooks/use-upload';
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
  errorId,
}: {
  label: string;
  labels: Record<string, string>;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  /** When provided, links the trigger to the error message via aria-describedby. */
  errorId?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-describedby={errorId}>
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
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile.mutateAsync({ file, folder: 'task-photos' });
      setPhotoUrl(url);
    } catch {
      // upload error handled by hook
    }
  };

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
            { planId, taskId: task.id, ...data, photoUrl: photoUrl ?? undefined },
            { onSuccess: () => resolve(), onError: (err) => reject(err) },
          );
        });
      }

      setProgress(null);
      reset();
      onOpenChange(false);
      onDone();
    },
    [tasks, planId, completeTask, reset, onOpenChange, onDone, photoUrl],
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
                  errorId={errors.result ? 'bulk-result-error' : undefined}
                />
              )}
            />
            {errors.result && (
              <p id="bulk-result-error" role="alert" className="text-destructive mt-1 text-sm">
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
                  errorId={errors.conditionFound ? 'bulk-conditionFound-error' : undefined}
                />
              )}
            />
            {errors.conditionFound && (
              <p
                id="bulk-conditionFound-error"
                role="alert"
                className="text-destructive mt-1 text-sm"
              >
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
                  errorId={errors.executor ? 'bulk-executor-error' : undefined}
                />
              )}
            />
            {errors.executor && (
              <p id="bulk-executor-error" role="alert" className="text-destructive mt-1 text-sm">
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
                  errorId={errors.actionTaken ? 'bulk-actionTaken-error' : undefined}
                />
              )}
            />
            {errors.actionTaken && (
              <p id="bulk-actionTaken-error" role="alert" className="text-destructive mt-1 text-sm">
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

          <div className="space-y-2">
            <Label>Foto (opcional, se aplica a todas las tareas)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            {photoUrl ? (
              <div className="relative inline-block">
                <img
                  src={photoUrl}
                  alt="Foto adjunta"
                  className="h-20 w-20 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="bg-destructive absolute -top-2 -right-2 rounded-full p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadFile.isPending}
                className="gap-2"
              >
                {uploadFile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                Agregar foto
              </Button>
            )}
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
              disabled={!!progress || uploadFile.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!!progress || uploadFile.isPending}>
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
