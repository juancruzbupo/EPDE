'use client';

import type { CreateTaskTemplateInput, TaskTemplate } from '@epde/shared';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUploadFile } from '@/hooks/use-upload';

interface GuideImageSectionProps {
  task: TaskTemplate | null;
  categoryId: string;
  setValue: UseFormReturn<CreateTaskTemplateInput>['setValue'];
  watch: UseFormReturn<CreateTaskTemplateInput>['watch'];
}

export function GuideImageSection({
  task,
  categoryId: _categoryId,
  setValue,
  watch,
}: GuideImageSectionProps) {
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {urls.map((url, i) => (
            <div key={i} className="group relative">
              <img
                src={url}
                alt={`Referencia ${i + 1} para ${task?.name ?? 'tarea'}`}
                loading="lazy"
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
