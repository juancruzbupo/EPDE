'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">Algo salio mal</h1>
        <p className="text-muted-foreground">
          Ocurrio un error inesperado. Por favor, intenta de nuevo.
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
