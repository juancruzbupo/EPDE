'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { completeTaskSchema, type CompleteTaskInput } from '@epde/shared';
import { useCompleteTask } from '@/hooks/use-maintenance-plans';
import { useUploadFile } from '@/hooks/use-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskPublic | null;
  planId: string;
}

export function CompleteTaskDialog({ open, onOpenChange, task, planId }: CompleteTaskDialogProps) {
  const completeTask = useCompleteTask();
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset } = useForm<CompleteTaskInput>({
    resolver: zodResolver(completeTaskSchema),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (preview) URL.revokeObjectURL(preview);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    uploadFile.mutate(
      { file, folder: 'task-photos' },
      {
        onSuccess: (url) => {
          setValue('photoUrl', url);
        },
        onError: () => {
          URL.revokeObjectURL(objectUrl);
          setPreview(null);
          setValue('photoUrl', undefined);
        },
      },
    );
  };

  const removePhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
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
          if (preview) URL.revokeObjectURL(preview);
          setPreview(null);
          onOpenChange(false);
        },
      },
    );
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Completar: {task.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <textarea
              {...register('notes')}
              placeholder="Describí el trabajo realizado..."
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Foto (opcional)</Label>
            {preview ? (
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="h-32 w-32 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white"
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
                <Upload className="h-4 w-4" />
                Subir foto
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

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
