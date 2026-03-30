import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export const ReportHeader = React.memo(function ReportHeader({
  propertyId,
}: {
  propertyId: string;
}) {
  return (
    <div className="no-print bg-background/95 sticky top-0 z-10 mb-6 flex items-center justify-between border-b py-3 backdrop-blur">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/properties/${propertyId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </Button>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              toast.success('Link copiado al portapapeles');
            } catch {
              toast.error('No se pudo copiar el link');
            }
          }}
        >
          Copiar link
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Informe técnico de tu vivienda: ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          Imprimir PDF
        </Button>
      </div>
    </div>
  );
});
