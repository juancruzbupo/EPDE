'use client';

import type { TaskType } from '@epde/shared';
import type { ConditionFound } from '@epde/shared';
import {
  ACTION_TAKEN_LABELS,
  type CompleteTaskInput,
  completeTaskSchema,
  CONDITION_FOUND_HINTS,
  CONDITION_FOUND_LABELS,
  CONDITION_TO_DEFAULT_RESULT,
  getErrorMessage,
  TASK_EXECUTOR_LABELS,
  TASK_RESULT_LABELS,
  TASK_TYPE_TO_DEFAULT_ACTION,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Loader2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

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

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskPublic | null;
  planId: string;
  onProblemDetected?: (info: { taskId: string; taskName: string; propertyId?: string }) => void;
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

export function CompleteTaskDialog({
  open,
  onOpenChange,
  task,
  planId,
  onProblemDetected,
}: CompleteTaskDialogProps) {
  const completeTask = useCompleteTask({ onProblemDetected });
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentObjectUrl = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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

  useEffect(() => {
    return () => {
      if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
    const objectUrl = URL.createObjectURL(file);
    currentObjectUrl.current = objectUrl;
    setPreview(objectUrl);

    uploadFile.mutate(
      { file, folder: 'task-photos' },
      {
        onSuccess: (url) => {
          // Guard: ignore if user already picked a different file
          if (currentObjectUrl.current !== objectUrl) return;
          setValue('photoUrl', url);
        },
        onError: (err) => {
          if (currentObjectUrl.current !== objectUrl) return;
          URL.revokeObjectURL(objectUrl);
          currentObjectUrl.current = null;
          setPreview(null);
          setValue('photoUrl', undefined);
          toast.error(getErrorMessage(err, 'Error al subir foto'));
        },
      },
    );
  };

  const removePhoto = () => {
    if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
    currentObjectUrl.current = null;
    setPreview(null);
    setValue('photoUrl', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: CompleteTaskInput) => {
    if (!task) return;
    completeTask.mutate(
      { planId, taskId: task.id, ...data },
      {
        onSuccess: () => {
          reset();
          if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
          currentObjectUrl.current = null;
          setPreview(null);
          onOpenChange(false);
        },
      },
    );
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar: {task.name}</DialogTitle>
          <DialogDescription>
            Registrá el resultado basado en lo observado durante la inspección. Los campos marcados
            con <span className="text-destructive">*</span> son obligatorios.
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
                <LabelSelect
                  label="¿Quién lo hizo?"
                  labels={TASK_EXECUTOR_LABELS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Ejecutor"
                  required
                  errorId={errors.executor ? 'executor-error' : undefined}
                />
              )}
            />
            {errors.executor && (
              <p id="executor-error" role="alert" className="text-destructive mt-1 text-sm">
                {errors.executor.message}
              </p>
            )}
          </div>

          {/* Expandable details */}
          {!showDetails && (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
              Agregar más detalles
            </button>
          )}

          {showDetails && (
            <>
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

              <div className="space-y-2">
                <Label>Foto (opcional)</Label>
                <p className="text-muted-foreground text-xs">
                  Foto del área inspeccionada para registro.
                </p>
                {preview ? (
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="Vista previa de foto para completar tarea"
                      className="h-32 w-32 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="bg-destructive focus-visible:ring-ring/50 absolute -top-2 -right-2 rounded-full p-1 text-white focus-visible:ring-[3px] focus-visible:outline-none"
                      aria-label="Eliminar foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {uploadFile.isPending && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-input hover:bg-accent flex items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm transition-colors"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Subir foto
                  </button>
                )}
                <p className="type-body-sm text-muted-foreground">Máx. 10 MB por archivo</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="Seleccionar foto de inspección"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
