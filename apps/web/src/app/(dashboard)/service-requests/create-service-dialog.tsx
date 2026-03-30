'use client';

import {
  type CreateServiceRequestInput,
  createServiceRequestSchema,
  getErrorMessage,
  SERVICE_URGENCY_LABELS,
  ServiceUrgency,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X } from 'lucide-react';
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
import { useDraft } from '@/hooks/use-draft';
import { useAllTasks } from '@/hooks/use-plans';
import { useProperties } from '@/hooks/use-properties';
import { useCreateServiceRequest } from '@/hooks/use-service-requests';
import { useUploadFile } from '@/hooks/use-upload';

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the property selector when opening from a task context. */
  defaultPropertyId?: string;
  /** Pre-fill the linked task when opening from a task context. */
  defaultTaskId?: string;
  /** Pre-fill the title field. */
  defaultTitle?: string;
  /** Pre-fill the description field. */
  defaultDescription?: string;
}

interface PhotoPreview {
  file: File;
  preview: string;
}

const NONE_VALUE = '__none__';

export function CreateServiceDialog({
  open,
  onOpenChange,
  defaultPropertyId,
  defaultTaskId,
  defaultTitle,
  defaultDescription,
}: CreateServiceDialogProps) {
  const createServiceRequest = useCreateServiceRequest();
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: propertiesData } = useProperties({});
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];

  const form = useForm<CreateServiceRequestInput>({
    resolver: zodResolver(createServiceRequestSchema),
    defaultValues: {
      urgency: ServiceUrgency.MEDIUM,
    },
  });
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // Disable draft when pre-filling from task context (prevents stale draft overwriting defaults)
  const hasDefaults = !!(defaultPropertyId || defaultTaskId || defaultTitle);
  const { clearDraft } = useDraft('draft:service-request:create', form, open && !hasDefaults);

  // Pre-fill property and task when provided (e.g. from task detail sheet)
  useEffect(() => {
    if (open && defaultPropertyId) {
      setValue('propertyId', defaultPropertyId, { shouldValidate: true });
    }
    if (open && defaultTaskId) {
      setValue('taskId', defaultTaskId);
    }
    if (open && defaultTitle) {
      setValue('title', defaultTitle);
    }
    if (open && defaultDescription) {
      setValue('description', defaultDescription);
    }
  }, [open, defaultPropertyId, defaultTaskId, defaultTitle, defaultDescription, setValue]);

  const selectedPropertyId = watch('propertyId');

  // Fetch tasks for the selected property
  const { data: propertyTasks } = useAllTasks(
    selectedPropertyId ? { propertyId: selectedPropertyId } : undefined,
  );
  const tasks = selectedPropertyId ? (propertyTasks ?? []) : [];

  // Re-apply defaultTaskId after tasks load (select needs options to be available)
  useEffect(() => {
    if (open && defaultTaskId && propertyTasks && propertyTasks.length > 0) {
      setValue('taskId', defaultTaskId);
    }
  }, [open, defaultTaskId, propertyTasks, setValue]);

  // Clear taskId when property changes (but not when pre-filling from task context)
  const defaultTaskIdRef = useRef(defaultTaskId);
  defaultTaskIdRef.current = defaultTaskId;
  useEffect(() => {
    if (!defaultTaskIdRef.current) {
      setValue('taskId', undefined);
    }
  }, [selectedPropertyId, setValue]);

  // Cleanup Object URLs on unmount to prevent memory leaks
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;

    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(
        `${oversized.length === 1 ? 'El archivo supera' : `${oversized.length} archivos superan`} el límite de 10 MB`,
      );
    }

    const valid = files.filter((f) => f.size <= MAX_FILE_SIZE);
    const newFiles = valid.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = [...prev];
      if (updated[index]) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const onSubmit = async (data: CreateServiceRequestInput) => {
    setIsUploading(true);
    try {
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const url = await uploadFile.mutateAsync({ file: photo.file, folder: 'service-requests' });
        photoUrls.push(url);
      }

      createServiceRequest.mutate(
        { ...data, photoUrls: photoUrls.length > 0 ? photoUrls : undefined },
        {
          onSuccess: () => {
            photos.forEach((p) => URL.revokeObjectURL(p.preview));
            setPhotos([]);
            clearDraft();
            reset();
            onOpenChange(false);
          },
        },
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al subir fotos'));
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = isUploading || createServiceRequest.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Servicio</DialogTitle>
          <DialogDescription>
            Describí el problema para crear una solicitud de servicio. El equipo de EPDE evaluará tu
            solicitud.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyId">
              Propiedad <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="propertyId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="propertyId"
                    className="w-full"
                    aria-describedby={errors.propertyId ? 'sr-propertyId-error' : undefined}
                  >
                    <SelectValue placeholder="Seleccionar propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.address}, {prop.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.propertyId && (
              <p id="sr-propertyId-error" role="alert" className="text-destructive text-sm">
                {errors.propertyId.message}
              </p>
            )}
          </div>

          {selectedPropertyId && tasks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="taskId">Tarea relacionada (opcional)</Label>
              <Controller
                control={control}
                name="taskId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE_VALUE}
                    onValueChange={(v) => field.onChange(v === NONE_VALUE ? undefined : v)}
                  >
                    <SelectTrigger id="taskId" className="w-full truncate">
                      <SelectValue placeholder="Seleccionar tarea" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Ninguna</SelectItem>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.category.name} — {task.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              aria-describedby={errors.title ? 'sr-title-error' : undefined}
              {...register('title')}
            />
            {errors.title && (
              <p id="sr-title-error" role="alert" className="text-destructive text-sm">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              aria-describedby={errors.description ? 'sr-description-error' : undefined}
              {...register('description')}
            />
            {errors.description && (
              <p id="sr-description-error" role="alert" className="text-destructive text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency">Urgencia</Label>
            <Controller
              control={control}
              name="urgency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="urgency"
                    className="w-full"
                    aria-describedby={errors.urgency ? 'sr-urgency-error' : undefined}
                  >
                    <SelectValue placeholder="Seleccionar urgencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_URGENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.urgency && (
              <p id="sr-urgency-error" role="alert" className="text-destructive text-sm">
                {errors.urgency.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fotos (max. 5)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              aria-label="Seleccionar fotos"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={photos.length >= 5}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir fotos
            </Button>
            <p className="type-body-sm text-muted-foreground">Máx. 10 MB por archivo</p>
            {photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    {/* User-uploaded blob URL — next/image doesn't support blob: protocol */}
                    <img
                      src={photo.preview}
                      alt={`Foto adjunta ${index + 1} de ${photos.length}`}
                      className="h-16 w-16 rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="bg-destructive focus-visible:ring-ring/50 absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full text-white focus-visible:ring-[3px] focus-visible:outline-none"
                      aria-label={`Eliminar foto ${index + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
