'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root{--primary:#c4704b;--primary-foreground:#fafaf8;--muted-foreground:#4a4542}
              .dark{--primary:#d4956f;--primary-foreground:#1a1715;--muted-foreground:#a09890}
            `,
          }}
        />
      </head>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Algo salió mal
            </h1>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Ocurrió un error inesperado. Por favor, intentá de nuevo.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
