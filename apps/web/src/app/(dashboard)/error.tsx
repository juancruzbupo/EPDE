'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">Algo salió mal</h1>
        <p className="text-muted-foreground">
          Ocurrió un error al cargar esta sección. El panel lateral sigue disponible.
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
