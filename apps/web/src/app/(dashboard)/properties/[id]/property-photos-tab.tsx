'use client';

import { Camera } from 'lucide-react';

import { ErrorState } from '@/components/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePropertyPhotos } from '@/hooks/use-properties';

export function PropertyPhotosTab({ propertyId }: { propertyId: string }) {
  const { data: photos, isLoading, isError, refetch } = usePropertyPhotos(propertyId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted/40 aspect-square animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState message="No se pudieron cargar las fotos" onRetry={refetch} className="py-12" />
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <Camera className="text-muted-foreground/60 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            No hay fotos registradas para esta propiedad.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-title-md">Galería de Fotos ({photos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <a
              key={`${photo.url}-${photo.date}`}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg border"
            >
              <img
                src={photo.url}
                alt={photo.description}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="truncate text-xs font-medium text-white">{photo.description}</p>
                <p className="text-xs text-white/70">
                  {photo.source === 'task' ? 'Tarea' : 'Solicitud'} ·{' '}
                  {new Date(photo.date).toLocaleDateString('es-AR')}
                </p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
