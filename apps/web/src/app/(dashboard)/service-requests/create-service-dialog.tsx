'use client';

import { useRef, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createServiceRequestSchema,
  type CreateServiceRequestInput,
  SERVICE_URGENCY_LABELS,
} from '@epde/shared';
import { useProperties } from '@/hooks/use-properties';
import { useCreateServiceRequest } from '@/hooks/use-service-requests';
import { useUploadFile } from '@/hooks/use-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X } from 'lucide-react';

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PhotoPreview {
  file: File;
  preview: string;
}

export function CreateServiceDialog({ open, onOpenChange }: CreateServiceDialogProps) {
  const createServiceRequest = useCreateServiceRequest();
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: propertiesData } = useProperties({});
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateServiceRequestInput>({
    resolver: zodResolver(createServiceRequestSchema),
    defaultValues: {
      urgency: 'MEDIUM',
    },
  });

  // Cleanup Object URLs on unmount to prevent memory leaks
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const newFiles = files.slice(0, remaining).map((file) => ({
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
            reset();
            onOpenChange(false);
          },
        },
      );
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = isUploading || createServiceRequest.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Servicio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyId">Propiedad</Label>
            <Controller
              control={control}
              name="propertyId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="propertyId" className="w-full">
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
              <p className="text-destructive text-sm">{errors.propertyId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && (
              <p className="text-destructive text-sm">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency">Urgencia</Label>
            <Controller
              control={control}
              name="urgency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="urgency" className="w-full">
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
            {errors.urgency && <p className="text-destructive text-sm">{errors.urgency.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Fotos (max. 5)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
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
            {photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo.preview}
                      alt={`Foto ${index + 1}`}
                      className="h-16 w-16 rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="bg-destructive focus-visible:ring-ring/50 absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white focus-visible:ring-[3px] focus-visible:outline-none"
                      aria-label={`Eliminar foto ${index + 1}`}
                    >
                      <X className="h-3 w-3" />
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
