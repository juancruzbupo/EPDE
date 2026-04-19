import { ArrowLeft, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

/**
 * Export del informe. "Descargar PDF" es CTA primario porque es lo que
 * Jorge (inversor con múltiples propiedades) más busca: guardar/mandar
 * al contador. Usamos window.print() — el diálogo nativo permite
 * "Guardar como PDF" como destino sin necesidad de librería server-side.
 * El primer click muestra un toast explicando cómo elegir ese destino,
 * dedupeado en localStorage para no ser pesado.
 */
const PDF_HINT_KEY = 'epde-pdf-hint-shown';

export const ReportHeader = React.memo(function ReportHeader({
  propertyId,
}: {
  propertyId: string;
}) {
  const [printing, setPrinting] = useState(false);

  const handleDownloadPDF = () => {
    try {
      const shown = localStorage.getItem(PDF_HINT_KEY);
      if (!shown) {
        toast.info(
          'En el diálogo que se abre, elegí "Guardar como PDF" en Destino para descargar el archivo.',
          { duration: 7000 },
        );
        localStorage.setItem(PDF_HINT_KEY, '1');
      }
    } catch {
      // localStorage puede fallar en modo incógnito — seguimos igual.
    }
    setPrinting(true);
    // Pequeño delay para que el toast renderice antes del bloqueo del
    // diálogo de impresión nativo.
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  };

  return (
    <div className="no-print bg-background/95 sticky top-0 z-10 mb-6 flex flex-col gap-2 border-b py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <Button variant="ghost" size="sm" asChild>
        <Link href={ROUTES.property(propertyId)}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Volver
        </Link>
      </Button>
      <div className="flex flex-wrap gap-2">
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
        <Button variant="outline" size="sm" onClick={() => window.print()} title="Imprimir directo">
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          Imprimir
        </Button>
        <Button onClick={handleDownloadPDF} disabled={printing}>
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          Descargar PDF
        </Button>
      </div>
    </div>
  );
});
