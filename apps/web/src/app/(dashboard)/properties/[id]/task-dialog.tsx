'use client';

import {
  createTaskSchema,
  PROFESSIONAL_REQUIREMENT_LABELS,
  PROPERTY_SECTOR_LABELS,
  RECURRENCE_TYPE_LABELS,
  RecurrenceType,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormSelect } from '@/components/form-select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useAddTask } from '@/hooks/use-plans';
import { useUpdateTask } from '@/hooks/use-task-operations';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

import { useTaskTemplates } from './use-task-templates';

type TaskFormValues = z.input<typeof createTaskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  task: TaskPublic | null;
  /** If provided, only these sectors are shown in the selector. */
  activeSectors?: string[];
}

export function TaskDialog({ open, onOpenChange, planId, task, activeSectors }: TaskDialogProps) {
  const isEdit = !!task;
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const [useCustomName, setUseCustomName] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      maintenancePlanId: planId,
      priority: 'MEDIUM',
      recurrenceType: 'ANNUAL',
    },
  });

  const recurrenceType = watch('recurrenceType');
  const watchedCategoryId = watch('categoryId');

  const { categories, categoriesLoading, taskTemplates, applyTemplate } = useTaskTemplates(
    watchedCategoryId,
    setValue,
  );

  const hasTemplates = taskTemplates.length > 0 && !isEdit;

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      if (templateId === '__custom__') {
        setUseCustomName(true);
        setValue('name', '');
        return;
      }
      const template = taskTemplates.find((t) => t.id === templateId);
      if (template) applyTemplate(template);
    },
    [taskTemplates, applyTemplate, setValue],
  );

  useEffect(() => {
    if (task) {
      setValue('maintenancePlanId', planId);
      setValue('categoryId', task.category.id);
      if (task.sector) setValue('sector', task.sector as TaskFormValues['sector']);
      setValue('name', task.name);
      setValue('description', task.description ?? '');
      setValue('priority', task.priority as TaskFormValues['priority']);
      setValue('recurrenceType', task.recurrenceType as TaskFormValues['recurrenceType']);
      setValue('taskType', task.taskType as TaskFormValues['taskType']);
      setValue(
        'professionalRequirement',
        task.professionalRequirement as TaskFormValues['professionalRequirement'],
      );
      if (task.technicalDescription) setValue('technicalDescription', task.technicalDescription);
      if (task.estimatedDurationMinutes)
        setValue('estimatedDurationMinutes', task.estimatedDurationMinutes);
      if (task.recurrenceMonths) setValue('recurrenceMonths', task.recurrenceMonths);
      if (task.nextDueDate) setValue('nextDueDate', new Date(task.nextDueDate));
    } else {
      reset({ maintenancePlanId: planId, priority: 'MEDIUM', recurrenceType: 'ANNUAL' });
      setUseCustomName(false);
    }
  }, [task, planId, setValue, reset]);

  const onSubmit = (data: TaskFormValues) => {
    const nextDueDate = data.nextDueDate ? new Date(data.nextDueDate).toISOString() : undefined;
    if (isEdit) {
      const { maintenancePlanId: _maintenancePlanId, ...dto } = data;
      updateTask.mutate(
        { planId, taskId: task!.id, ...dto, nextDueDate },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      addTask.mutate(
        { ...data, planId, nextDueDate },
        {
          onSuccess: () => {
            reset();
            onOpenChange(false);
          },
        },
      );
    }
  };

  const isPending = addTask.isPending || updateTask.isPending;

  const [showAdvanced, setShowAdvanced] = useState(isEdit);

  const sectorOptions = activeSectors
    ? Object.fromEntries(
        Object.entries(PROPERTY_SECTOR_LABELS).filter(([k]) => activeSectors.includes(k)),
      )
    : PROPERTY_SECTOR_LABELS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {isEdit
              ? 'Modificá los datos de la tarea.'
              : 'Completá los datos para crear una nueva tarea de mantenimiento.'}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register('maintenancePlanId')} />

          {/* ─── Section 1: Identificación ─── */}
          <fieldset className="space-y-4">
            <legend className="text-foreground mb-1 text-sm font-semibold">Identificación</legend>

            {/* Category (required) */}
            <div className="space-y-1.5">
              <Label htmlFor="task-category">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('categoryId') ?? ''}
                onValueChange={(v) => {
                  setValue('categoryId', v);
                  setValue('name', '');
                  setUseCustomName(false);
                }}
                disabled={categoriesLoading}
              >
                <SelectTrigger
                  id="task-category"
                  aria-invalid={!!errors.categoryId}
                  aria-describedby={errors.categoryId ? 'category-error' : undefined}
                >
                  <SelectValue
                    placeholder={categoriesLoading ? 'Cargando...' : 'Seleccionar categoría'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Especialidad técnica de la tarea (ej: Estructura, Eléctrica).
              </p>
              {errors.categoryId && (
                <p id="category-error" role="alert" className="text-destructive text-xs">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Name (required) */}
            <div className="space-y-1.5">
              <Label htmlFor="task-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              {hasTemplates && !useCustomName ? (
                <Select onValueChange={handleTemplateSelect} disabled={!watchedCategoryId}>
                  <SelectTrigger id="task-name">
                    <SelectValue
                      placeholder={
                        watchedCategoryId
                          ? 'Seleccionar de plantillas...'
                          : 'Seleccioná categoría primero'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Nombre personalizado...</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="task-name"
                    className="flex-1"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    disabled={!watchedCategoryId && !isEdit}
                    placeholder={watchedCategoryId || isEdit ? 'Nombre de la tarea' : ''}
                    {...register('name')}
                  />
                  {hasTemplates && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        setUseCustomName(false);
                        setValue('name', '');
                      }}
                    >
                      Plantilla
                    </Button>
                  )}
                </div>
              )}
              {errors.name && (
                <p id="name-error" role="alert" className="text-destructive text-xs">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Sector (optional) */}
            <div className="space-y-1.5">
              <FormSelect
                id="task-sector"
                label="Sector"
                value={watch('sector') ?? ''}
                onValueChange={(v) =>
                  setValue('sector', (v || undefined) as TaskFormValues['sector'])
                }
                options={sectorOptions}
                placeholder="Seleccionar sector"
              />
              <p className="text-muted-foreground text-xs">
                Zona de la vivienda donde se realiza (ej: Techo, Baño, Exterior).
              </p>
            </div>
          </fieldset>

          {/* ─── Section 2: Programación ─── */}
          <fieldset className="space-y-4">
            <legend className="text-foreground mb-1 text-sm font-semibold">Programación</legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormSelect
                id="task-priority"
                label="Prioridad"
                value={watch('priority') ?? 'MEDIUM'}
                onValueChange={(v) => setValue('priority', v as TaskFormValues['priority'])}
                options={TASK_PRIORITY_LABELS}
              />
              <FormSelect
                id="task-recurrence"
                label="Recurrencia"
                value={watch('recurrenceType') ?? 'ANNUAL'}
                onValueChange={(v) =>
                  setValue('recurrenceType', v as TaskFormValues['recurrenceType'])
                }
                options={RECURRENCE_TYPE_LABELS}
              />
            </div>

            {recurrenceType === RecurrenceType.CUSTOM && (
              <div className="space-y-1.5">
                <Label htmlFor="task-recurrence-months">Intervalo en meses</Label>
                <Input
                  id="task-recurrence-months"
                  type="number"
                  min={1}
                  max={120}
                  placeholder="Ej: 18"
                  {...register('recurrenceMonths')}
                />
                <p className="text-muted-foreground text-xs">
                  Cada cuántos meses se repite esta tarea.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="task-due-date">Próxima fecha de vencimiento</Label>
              <Input
                id="task-due-date"
                type="date"
                aria-describedby={errors.nextDueDate ? 'nextDueDate-error' : undefined}
                {...register('nextDueDate')}
              />
              <p className="text-muted-foreground text-xs">
                Dejá vacío para tareas que se detectan visualmente (sin fecha fija).
              </p>
              {errors.nextDueDate && (
                <p id="nextDueDate-error" role="alert" className="text-destructive text-xs">
                  {errors.nextDueDate.message}
                </p>
              )}
            </div>
          </fieldset>

          {/* ─── Section 3: Detalles técnicos (colapsable) ─── */}
          <fieldset>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
              className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1 text-sm transition-colors"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvanced ? '' : '-rotate-90'}`}
              />
              Detalles técnicos
              <span className="text-muted-foreground/60 ml-1 text-xs">(opcional)</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="task-description">Descripción</Label>
                  <Textarea
                    id="task-description"
                    rows={2}
                    placeholder="Qué incluye esta tarea..."
                    {...register('description')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormSelect
                    id="task-type"
                    label="Tipo de tarea"
                    value={watch('taskType') ?? 'INSPECTION'}
                    onValueChange={(v) => setValue('taskType', v as TaskFormValues['taskType'])}
                    options={TASK_TYPE_LABELS}
                  />
                  <FormSelect
                    id="task-professional"
                    label="Req. profesional"
                    value={watch('professionalRequirement') ?? 'OWNER_CAN_DO'}
                    onValueChange={(v) =>
                      setValue(
                        'professionalRequirement',
                        v as TaskFormValues['professionalRequirement'],
                      )
                    }
                    options={PROFESSIONAL_REQUIREMENT_LABELS}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="task-technical-desc">Descripción técnica</Label>
                    <Input
                      id="task-technical-desc"
                      placeholder="Detalles para el profesional"
                      {...register('technicalDescription')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="task-duration">Duración estimada</Label>
                    <Input
                      id="task-duration"
                      type="number"
                      min={1}
                      placeholder="Minutos"
                      {...register('estimatedDurationMinutes')}
                    />
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          {/* ─── Actions ─── */}
          <div className="border-border flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
