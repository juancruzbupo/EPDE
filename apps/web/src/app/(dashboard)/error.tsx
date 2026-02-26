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
        <h1 className="text-2xl font-bold">Algo salio mal</h1>
        <p className="text-muted-foreground">
          Ocurrio un error al cargar esta seccion. El panel lateral sigue disponible.
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
