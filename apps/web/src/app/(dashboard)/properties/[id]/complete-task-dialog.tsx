'use client';

import type { ConditionFound, TaskType } from '@epde/shared';
import {
  ACTION_TAKEN_LABELS,
  type CompleteTaskInput,
  completeTaskSchema,
  CONDITION_BG_VARIANTS,
  CONDITION_FOUND_HINTS,
  CONDITION_FOUND_LABELS,
  CONDITION_TO_DEFAULT_RESULT,
  TASK_EXECUTOR_HINTS,
  TASK_EXECUTOR_LABELS,
  TASK_RESULT_LABELS,
  TASK_TYPE_TO_DEFAULT_ACTION,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LabelSelect } from '@/components/ui/label-select';
import { Textarea } from '@/components/ui/textarea';
import { useCompleteTask } from '@/hooks/use-task-operations';
import { useUploadFile } from '@/hooks/use-upload';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

import { TaskPhotoUpload } from './task-photo-upload';

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskPublic | null;
  planId: string;
  onProblemDetected?: (info: { taskId: string; taskName: string; propertyId?: string }) => void;
}

export function CompleteTaskDialog({
  open,
  onOpenChange,
  task,
  planId,
  onProblemDetected,
}: CompleteTaskDialogProps) {
  const completeTask = useCompleteTask({ onProblemDetected });
  const uploadFile = useUploadFile();
  const [showDetails, setShowDetails] = useState(false);

  const defaultAction = task ? TASK_TYPE_TO_DEFAULT_ACTION[task.taskType as TaskType] : undefined;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<CompleteTaskInput>({
    resolver: zodResolver(completeTaskSchema),
    defaultValues: {
      executor: 'OWNER',
      actionTaken: defaultAction,
    },
  });

  // Quick mode: auto-infer result from conditionFound
  const watchedCondition = watch('conditionFound');
  useEffect(() => {
    if (!showDetails && watchedCondition) {
      const inferred = CONDITION_TO_DEFAULT_RESULT[watchedCondition as ConditionFound];
      if (inferred) setValue('result', inferred);
      if (defaultAction) setValue('actionTaken', defaultAction);
    }
  }, [watchedCondition, showDetails, setValue, defaultAction]);

  const onSubmit = (data: CompleteTaskInput) => {
    if (!task) return;
    completeTask.mutate(
      { planId, taskId: task.id, ...data },
      {
        onSuccess: () => {
          reset();
          setShowDetails(false);
          onOpenChange(false);
        },
      },
    );
  };

  if (!task) return null;

  const handleOpenChange = (value: boolean) => {
    if (!value) setShowDetails(false);
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar: {task.name}</DialogTitle>
          <DialogDescription>
            Solo necesitás completar 2 campos. Si querés agregar costo, notas o fotos, expandí
            &quot;Más detalles&quot;.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          aria-busy={completeTask.isPending}
        >
          {/* Essential field 1: Condition */}
          <div>
            <Controller
              control={control}
              name="conditionFound"
              render={({ field }) => (
                <>
                  <LabelSelect
                    label="¿En qué estado está?"
                    labels={CONDITION_FOUND_LABELS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Estado general"
                    required
                    errorId={errors.conditionFound ? 'conditionFound-error' : undefined}
                    colorMap={CONDITION_BG_VARIANTS}
                  />
                  {field.value && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {CONDITION_FOUND_HINTS[field.value as keyof typeof CONDITION_FOUND_HINTS]}
                    </p>
                  )}
                </>
              )}
            />
            {errors.conditionFound && (
              <p id="conditionFound-error" role="alert" className="text-destructive mt-1 text-sm">
                {errors.conditionFound.message}
              </p>
            )}
          </div>

          {/* Essential field 2: Executor */}
          <div>
            <Controller
              control={control}
              name="executor"
              render={({ field }) => (
                <>
                  <LabelSelect
                    label="¿Quién lo hizo?"
                    labels={TASK_EXECUTOR_LABELS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Ejecutor"
                    required
                    errorId={errors.executor ? 'executor-error' : undefined}
                  />
                  {field.value && TASK_EXECUTOR_HINTS[field.value] && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {TASK_EXECUTOR_HINTS[field.value]}
                    </p>
                  )}
                </>
              )}
            />
            {errors.executor && (
              <p id="executor-error" role="alert" className="text-destructive mt-1 text-sm">
                {errors.executor.message}
              </p>
            )}
          </div>

          {/* Toggle details */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-controls="complete-task-details"
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            {showDetails ? 'Menos detalles' : 'Agregar más detalles'}
          </button>

          {showDetails && (
            <div id="complete-task-details" className="contents">
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
                      errorId={errors.result ? 'result-error' : undefined}
                    />
                  )}
                />
                {errors.result && (
                  <p id="result-error" role="alert" className="text-destructive mt-1 text-sm">
                    {errors.result.message}
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
                      errorId={errors.actionTaken ? 'actionTaken-error' : undefined}
                    />
                  )}
                />
                {errors.actionTaken && (
                  <p id="actionTaken-error" role="alert" className="text-destructive mt-1 text-sm">
                    {errors.actionTaken.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Costo</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...register('cost')} />
                <p className="text-muted-foreground text-xs">Monto en ARS (opcional).</p>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  {...register('note')}
                  placeholder="Describí el trabajo realizado..."
                  className="resize-none"
                  rows={3}
                />
              </div>

              <TaskPhotoUpload
                uploadMutation={uploadFile}
                onChange={(url) => setValue('photoUrl', url ?? undefined)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={completeTask.isPending || uploadFile.isPending}>
              {completeTask.isPending ? 'Completando...' : 'Completar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
