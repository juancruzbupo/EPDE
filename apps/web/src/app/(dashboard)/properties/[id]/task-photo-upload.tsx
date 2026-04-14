'use client';

import { getErrorMessage } from '@epde/shared';
import { Loader2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Label } from '@/components/ui/label';
import { useUploadFile } from '@/hooks/use-upload';

interface TaskPhotoUploadProps {
  /** Shared upload mutation so the parent can read `isPending` for submit-disable. */
  uploadMutation: ReturnType<typeof useUploadFile>;
  /** Called with the uploaded URL when the upload succeeds. Also called with `null` on remove. */
  onChange: (photoUrl: string | null) => void;
}

/**
 * File picker + preview + remove, scoped to task completion photos.
 *
 * The blob URL lifecycle (createObjectURL / revokeObjectURL) is managed here.
 * The `uploadMutation` is lifted to the parent so it can observe `isPending`
 * and gate the submit button.
 */
export function TaskPhotoUpload({ uploadMutation, onChange }: TaskPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentObjectUrl = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
    const objectUrl = URL.createObjectURL(file);
    currentObjectUrl.current = objectUrl;
    setPreview(objectUrl);

    uploadMutation.mutate(
      { file, folder: 'task-photos' },
      {
        onSuccess: (url) => {
          // Guard: ignore if user already picked a different file
          if (currentObjectUrl.current !== objectUrl) return;
          onChange(url);
        },
        onError: (err) => {
          if (currentObjectUrl.current !== objectUrl) return;
          URL.revokeObjectURL(objectUrl);
          currentObjectUrl.current = null;
          setPreview(null);
          onChange(null);
          toast.error(getErrorMessage(err, 'Error al subir foto'));
        },
      },
    );
  };

  const removePhoto = () => {
    if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
    currentObjectUrl.current = null;
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>Foto (opcional)</Label>
      <p className="text-muted-foreground text-xs">Foto del área inspeccionada para registro.</p>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Vista previa de foto para completar tarea"
            className="h-32 w-32 rounded-md object-cover"
          />
          <button
            type="button"
            onClick={removePhoto}
            className="bg-destructive focus-visible:ring-ring/50 absolute -top-2 -right-2 rounded-full p-1 text-white focus-visible:ring-[3px] focus-visible:outline-none"
            aria-label="Eliminar foto"
          >
            <X className="h-3 w-3" />
          </button>
          {uploadMutation.isPending && (
            <div className="bg-foreground/40 absolute inset-0 flex items-center justify-center rounded-md">
              <Loader2 className="text-background h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Subir foto de inspección"
          className="border-input hover:bg-muted/40 flex items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm transition-colors"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Subir foto
        </button>
      )}
      <p className="type-body-sm text-muted-foreground">Máx. 10 MB por archivo</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Seleccionar foto de inspección"
      />
    </div>
  );
}
