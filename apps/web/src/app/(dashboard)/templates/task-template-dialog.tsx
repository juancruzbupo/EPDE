'use client';

import type { TaskTemplate } from '@epde/shared';
import { type CreateTaskTemplateInput, createTaskTemplateSchema } from '@epde/shared';
import {
  PROFESSIONAL_REQUIREMENT_LABELS,
  PROPERTY_SECTOR_LABELS,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Markdown from 'react-markdown';

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
import { useCreateTaskTemplate, useUpdateTaskTemplate } from '@/hooks/use-category-templates';
import { useUploadFile } from '@/hooks/use-upload';

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
    watch,
    setValue,
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
        defaultSector: task.defaultSector ?? undefined,
        inspectionGuide: task.inspectionGuide ?? undefined,
        guideImageUrls: task.guideImageUrls ?? [],
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
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tarea Template' : 'Nueva Tarea Template'}</DialogTitle>
          <DialogDescription>Configurá los datos de la plantilla de tarea.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tpl-task-name">Nombre</Label>
            <Input
              id="tpl-task-name"
              aria-describedby={errors.name ? 'tpl-task-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="tpl-task-name-error" role="alert" className="text-destructive text-sm">
                {errors.name.message}
              </p>
            )}
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
            <Label>Sector por defecto</Label>
            <Controller
              name="defaultSector"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? '_none'}
                  onValueChange={(v) => field.onChange(v === '_none' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin sector</SelectItem>
                    {Object.entries(PROPERTY_SECTOR_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-muted-foreground text-xs">
              Las tareas creadas desde este template se asignan automáticamente a este sector.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-task-tech-desc">Descripción técnica (opcional)</Label>
            <Input id="tpl-task-tech-desc" {...register('technicalDescription')} />
          </div>

          <GuideEditorSection control={control} register={register} />
          <GuideImageSection
            task={task}
            categoryId={categoryId}
            setValue={setValue}
            watch={watch}
          />

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

// ─── Guide Editor (Markdown) ──────────────────────────

function GuideEditorSection({
  control,
  register,
}: {
  control: ReturnType<typeof useForm<CreateTaskTemplateInput>>['control'];
  register: ReturnType<typeof useForm<CreateTaskTemplateInput>>['register'];
}) {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Guía de inspección (markdown)</Label>
        <Controller
          name="inspectionGuide"
          control={control}
          render={({ field }) =>
            field.value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Editar' : 'Vista previa'}
              </Button>
            ) : (
              <span />
            )
          }
        />
      </div>
      <Controller
        name="inspectionGuide"
        control={control}
        render={({ field }) =>
          previewMode && field.value ? (
            <div className="prose prose-sm dark:prose-invert border-border max-h-60 max-w-none overflow-y-auto rounded-md border p-3">
              <Markdown>{field.value}</Markdown>
            </div>
          ) : (
            <Textarea
              {...register('inspectionGuide')}
              rows={6}
              placeholder="## Qué buscar&#10;- Fisuras diagonales&#10;- Manchas de humedad&#10;&#10;## Criterios&#10;| Estado | Condición |&#10;|--------|-----------|&#10;| OK | Sin hallazgos |"
              className="font-mono text-xs"
            />
          )
        }
      />
      <p className="text-muted-foreground text-xs">
        Instrucciones detalladas para la arquitecta. Soporta markdown (títulos, listas, tablas).
      </p>
    </div>
  );
}

// ─── Guide Images ─────────────────────────────────────

function GuideImageSection({
  task,
  categoryId: _categoryId,
  setValue,
  watch,
}: {
  task: TaskTemplate | null;
  categoryId: string;
  setValue: ReturnType<typeof useForm<CreateTaskTemplateInput>>['setValue'];
  watch: ReturnType<typeof useForm<CreateTaskTemplateInput>>['watch'];
}) {
  const uploadFile = useUploadFile();
  const urls = watch('guideImageUrls') ?? [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile.mutateAsync({ file, folder: 'guides' });
    setValue('guideImageUrls', [...urls, result]);
  };

  const removeImage = (index: number) => {
    setValue(
      'guideImageUrls',
      urls.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="space-y-2">
      <Label>Imágenes de referencia ({urls.length}/10)</Label>
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {urls.map((url, i) => (
            <div key={i} className="group relative">
              <img
                src={url}
                alt={`Referencia ${i + 1} para ${task?.name ?? 'tarea'}`}
                className="border-border h-24 w-full rounded-md border object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => removeImage(i)}
                aria-label="Eliminar imagen"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {urls.length < 10 && (
        <label className="border-border text-muted-foreground hover:border-primary hover:text-primary flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-xs transition-colors">
          {uploadFile.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Agregar imagen
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploadFile.isPending}
          />
        </label>
      )}
    </div>
  );
}
