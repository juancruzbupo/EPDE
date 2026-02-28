'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskTemplateSchema, type CreateTaskTemplateInput } from '@epde/shared/schemas';
import {
  TASK_TYPE_LABELS,
  PROFESSIONAL_REQUIREMENT_LABELS,
  TASK_PRIORITY_LABELS,
  RECURRENCE_TYPE_LABELS,
} from '@epde/shared';
import { useCreateTaskTemplate, useUpdateTaskTemplate } from '@/hooks/use-category-templates';
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
import type { TaskTemplate } from '@epde/shared';

interface TaskTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  task: TaskTemplate | null;
}

export function TaskTemplateDialog({
  open,
  onOpenChange,
  categoryId,
  task,
}: TaskTemplateDialogProps) {
  const isEdit = !!task;
  const createTask = useCreateTaskTemplate();
  const updateTask = useUpdateTaskTemplate();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateTaskTemplateInput>({
    // zodResolver + z.default() causes input/output type mismatch — safe to cast
    resolver: zodResolver(createTaskTemplateSchema) as never,
    defaultValues: {
      name: '',
      taskType: 'INSPECTION',
      professionalRequirement: 'OWNER_CAN_DO',
      priority: 'MEDIUM',
      recurrenceType: 'ANNUAL',
      recurrenceMonths: 12,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        name: task.name,
        taskType: task.taskType,
        professionalRequirement: task.professionalRequirement,
        technicalDescription: task.technicalDescription ?? '',
        priority: task.priority,
        recurrenceType: task.recurrenceType,
        recurrenceMonths: task.recurrenceMonths,
        estimatedDurationMinutes: task.estimatedDurationMinutes ?? undefined,
        displayOrder: task.displayOrder,
      });
    } else {
      reset({
        name: '',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        displayOrder: 0,
      });
    }
  }, [task, reset]);

  const onSubmit = (data: CreateTaskTemplateInput) => {
    if (isEdit) {
      updateTask.mutate({ id: task!.id, ...data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createTask.mutate(
        { categoryId, ...data },
        {
          onSuccess: () => {
            reset();
            onOpenChange(false);
          },
        },
      );
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tarea Template' : 'Nueva Tarea Template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tpl-task-name">Nombre</Label>
            <Input id="tpl-task-name" {...register('name')} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Tarea</Label>
              <Controller
                name="taskType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_TYPE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Requisito Profesional</Label>
              <Controller
                name="professionalRequirement"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROFESSIONAL_REQUIREMENT_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_PRIORITY_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Recurrencia</Label>
              <Controller
                name="recurrenceType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECURRENCE_TYPE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tpl-task-months">Meses de recurrencia</Label>
              <Input
                id="tpl-task-months"
                type="number"
                min={1}
                max={120}
                {...register('recurrenceMonths')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-task-duration">Duración estimada (min)</Label>
              <Input
                id="tpl-task-duration"
                type="number"
                min={1}
                {...register('estimatedDurationMinutes')}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-task-tech-desc">Descripción técnica (opcional)</Label>
            <Input id="tpl-task-tech-desc" {...register('technicalDescription')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-task-order">Orden</Label>
            <Input
              id="tpl-task-order"
              type="number"
              min={0}
              {...register('displayOrder')}
              className="w-24"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
