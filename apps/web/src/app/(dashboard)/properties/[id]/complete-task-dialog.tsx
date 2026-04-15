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
import { Camera, ChevronDown, ClipboardCheck, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { HelpHint } from '@/components/help-hint';
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
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  // Quick mode: auto-infer result/action when the user hasn't opened the 'result' section.
  // Once they open it to edit, we stop overwriting so their explicit choice wins.
  const watchedCondition = watch('conditionFound');
  const resultSectionOpen = openSections.has('result');
  useEffect(() => {
    if (!resultSectionOpen && watchedCondition) {
      const inferred = CONDITION_TO_DEFAULT_RESULT[watchedCondition as ConditionFound];
      if (inferred) setValue('result', inferred);
      if (defaultAction) setValue('actionTaken', defaultAction);
    }
  }, [watchedCondition, resultSectionOpen, setValue, defaultAction]);

  // If validation surfaces an error on a hidden section, expand it so the user sees the error.
  useEffect(() => {
    if (errors.result || errors.actionTaken) {
      setOpenSections((prev) => {
        if (prev.has('result')) return prev;
        const next = new Set(prev);
        next.add('result');
        return next;
      });
    }
  }, [errors.result, errors.actionTaken]);

  const onSubmit = (data: CompleteTaskInput) => {
    if (!task) return;
    completeTask.mutate(
      { planId, taskId: task.id, ...data },
      {
        onSuccess: () => {
          reset();
          setOpenSections(new Set());
          onOpenChange(false);
        },
      },
    );
  };

  if (!task) return null;

  const handleOpenChange = (value: boolean) => {
    if (!value) setOpenSections(new Set());
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar: {task.name}</DialogTitle>
          <DialogDescription>
            Solo necesitás completar 2 campos. Si querés, agregá detalles del resultado, costo o
            foto en las secciones de abajo.
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
                    help={
                      <HelpHint term="Condición">
                        <p>
                          Cómo encontraste la cosa al inspeccionarla: Excelente, Bueno, Aceptable,
                          Malo o Crítico. EPDE usa este valor para calcular el ISV (salud de la
                          vivienda).
                        </p>
                      </HelpHint>
                    }
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
                    help={
                      <HelpHint term="Ejecutor">
                        <p>
                          Quién realizó la tarea: vos mismo, un profesional contratado por tu
                          cuenta, o EPDE (si coordinamos el trabajo). Se usa para el historial y
                          para sugerir el tipo de acción por default.
                        </p>
                      </HelpHint>
                    }
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

          {/* Progressive-disclosure sections — each collapsed by default but labeled so
              users know what's inside without expanding. */}
          <CollapsibleSection
            id="result"
            icon={ClipboardCheck}
            label="Resultado y acción"
            hint="¿Cómo resultó y qué se hizo?"
            open={openSections.has('result')}
            onToggle={() => toggleSection('result')}
          >
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
                    errorId={errors.result ? 'result-error' : undefined}
                    help={
                      <HelpHint term="Resultado de tarea">
                        <p>
                          Qué conseguiste con la tarea: OK (todo bien), OK con observaciones (anduvo
                          pero hay algo a vigilar), necesita reparación, o no se pudo hacer. Se
                          auto-completa según la condición — editá si corresponde.
                        </p>
                      </HelpHint>
                    }
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
                    errorId={errors.actionTaken ? 'actionTaken-error' : undefined}
                    help={
                      <HelpHint term="Acción realizada">
                        <p>
                          El tipo de trabajo hecho: sólo inspección, limpieza, lubricación,
                          reparación menor, reemplazo, etc. Se usa para medir prevención vs
                          reparación en el ISV (dimensión &laquo;¿Prevenís o reparás?&raquo;).
                        </p>
                      </HelpHint>
                    }
                  />
                )}
              />
              {errors.actionTaken && (
                <p id="actionTaken-error" role="alert" className="text-destructive mt-1 text-sm">
                  {errors.actionTaken.message}
                </p>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="notes"
            icon={FileText}
            label="Costo y notas"
            hint="Registrá el gasto y observaciones"
            open={openSections.has('notes')}
            onToggle={() => toggleSection('notes')}
          >
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Costo</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...register('cost')} />
              <p className="text-muted-foreground text-xs">Monto en ARS (opcional).</p>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                {...register('note')}
                placeholder="Describí el trabajo realizado..."
                className="resize-none"
                rows={3}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="photo"
            icon={Camera}
            label="Foto del trabajo"
            hint="Subí una foto de cómo quedó"
            open={openSections.has('photo')}
            onToggle={() => toggleSection('photo')}
          >
            <TaskPhotoUpload
              uploadMutation={uploadFile}
              onChange={(url) => setValue('photoUrl', url ?? undefined)}
            />
          </CollapsibleSection>

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

function CollapsibleSection({
  id,
  icon: Icon,
  label,
  hint,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const panelId = `complete-task-section-${id}`;
  return (
    <div className="border-border rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="hover:bg-muted/40 focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
      >
        <Icon className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden={true} />
        <div className="min-w-0 flex-1">
          <p className="type-label-lg">{label}</p>
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
        <ChevronDown
          className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={panelId} className="space-y-4 px-3 pt-1 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}
