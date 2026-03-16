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
}

export function TaskDialog({ open, onOpenChange, planId, task }: TaskDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tarea' : 'Agregar Tarea'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('maintenancePlanId')} />

          {/* Sector select */}
          <FormSelect
            id="task-sector"
            label="Sector de la vivienda"
            value={watch('sector') ?? ''}
            onValueChange={(v) => setValue('sector', (v || undefined) as TaskFormValues['sector'])}
            options={PROPERTY_SECTOR_LABELS}
            placeholder="Seleccionar sector (opcional)"
          />

          {/* Category select — uses dynamic list, not label map */}
          <div className="space-y-2">
            <Label htmlFor="task-category">Categoría</Label>
            <Select
              value={watch('categoryId') ?? ''}
              onValueChange={(v) => {
                setValue('categoryId', v);
                setValue('name', '');
                setUseCustomName(false);
              }}
              disabled={categoriesLoading}
            >
              <SelectTrigger id="task-category">
                <SelectValue
                  placeholder={
                    categoriesLoading ? 'Cargando categorías...' : 'Seleccionar categoría'
                  }
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
            {errors.categoryId && (
              <p className="text-destructive text-sm">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Name — template select or free-text input */}
          <div className="space-y-2">
            <Label htmlFor="task-name">Nombre</Label>
            {hasTemplates && !useCustomName ? (
              <Select onValueChange={handleTemplateSelect} disabled={!watchedCategoryId}>
                <SelectTrigger id="task-name">
                  <SelectValue
                    placeholder={
                      watchedCategoryId
                        ? 'Seleccionar plantilla...'
                        : 'Seleccioná una categoría primero'
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
                  disabled={!watchedCategoryId && !isEdit}
                  placeholder={
                    watchedCategoryId || isEdit ? '' : 'Seleccioná una categoría primero'
                  }
                  {...register('name')}
                />
                {hasTemplates && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 self-center"
                    onClick={() => {
                      setUseCustomName(false);
                      setValue('name', '');
                    }}
                  >
                    Usar plantilla
                  </Button>
                )}
              </div>
            )}
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Descripción (opcional)</Label>
            <Textarea id="task-description" rows={3} {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="task-recurrence-months">Meses personalizados</Label>
              <Input
                id="task-recurrence-months"
                type="number"
                min={1}
                max={120}
                {...register('recurrenceMonths')}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              id="task-type"
              label="Tipo de tarea"
              value={watch('taskType') ?? 'INSPECTION'}
              onValueChange={(v) => setValue('taskType', v as TaskFormValues['taskType'])}
              options={TASK_TYPE_LABELS}
            />
            <FormSelect
              id="task-professional"
              label="Requerimiento profesional"
              value={watch('professionalRequirement') ?? 'OWNER_CAN_DO'}
              onValueChange={(v) =>
                setValue('professionalRequirement', v as TaskFormValues['professionalRequirement'])
              }
              options={PROFESSIONAL_REQUIREMENT_LABELS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-technical-desc">Descripción técnica (opcional)</Label>
              <Input id="task-technical-desc" {...register('technicalDescription')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-duration">Duración estimada (min, opcional)</Label>
              <Input
                id="task-duration"
                type="number"
                min={1}
                {...register('estimatedDurationMinutes')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due-date">Próxima fecha de vencimiento</Label>
            <Input id="task-due-date" type="date" {...register('nextDueDate')} />
            {errors.nextDueDate && (
              <p className="text-destructive text-sm">{errors.nextDueDate.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
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
