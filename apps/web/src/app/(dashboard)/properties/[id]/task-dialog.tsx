'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createTaskSchema, TASK_PRIORITY_LABELS, RECURRENCE_TYPE_LABELS } from '@epde/shared';
import { useAddTask, useUpdateTask } from '@/hooks/use-maintenance-plans';
import { useCategories } from '@/hooks/use-categories';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

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
  const { data: categories, isLoading: categoriesLoading } = useCategories();

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

  useEffect(() => {
    if (task) {
      setValue('maintenancePlanId', planId);
      setValue('categoryId', task.category.id);
      setValue('name', task.name);
      setValue('description', task.description ?? '');
      setValue('priority', task.priority as TaskFormValues['priority']);
      setValue('recurrenceType', task.recurrenceType as TaskFormValues['recurrenceType']);
      if (task.recurrenceMonths) setValue('recurrenceMonths', task.recurrenceMonths);
      if (task.nextDueDate) setValue('nextDueDate', new Date(task.nextDueDate));
    } else {
      reset({ maintenancePlanId: planId, priority: 'MEDIUM', recurrenceType: 'ANNUAL' });
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tarea' : 'Agregar Tarea'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('maintenancePlanId')} />

          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Input {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={watch('categoryId') ?? ''}
              onValueChange={(v) => setValue('categoryId', v)}
              disabled={categoriesLoading}
            >
              <SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={watch('priority') ?? 'MEDIUM'}
                onValueChange={(v) => setValue('priority', v as TaskFormValues['priority'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recurrencia</Label>
              <Select
                value={watch('recurrenceType') ?? 'ANNUAL'}
                onValueChange={(v) =>
                  setValue('recurrenceType', v as TaskFormValues['recurrenceType'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRENCE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {recurrenceType === 'CUSTOM' && (
            <div className="space-y-2">
              <Label>Meses personalizados</Label>
              <Input type="number" min={1} max={120} {...register('recurrenceMonths')} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Próxima fecha de vencimiento</Label>
            <Input type="date" {...register('nextDueDate')} />
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
