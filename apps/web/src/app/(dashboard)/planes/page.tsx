'use client';

import { PageHeader } from '@/components/page-header';
import { PageTransition } from '@/components/ui/page-transition';
import { ClipboardList } from 'lucide-react';

export default function PlanesPage() {
  return (
    <PageTransition>
      <PageHeader
        title="Planes de Mantenimiento"
        description="Visualizá y gestioná los planes de mantenimiento preventivo de cada propiedad."
      />

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ClipboardList className="text-muted-foreground/40 mb-4 h-12 w-12" />
        <h2 className="text-muted-foreground text-lg font-medium">
          Vista de planes en construcción
        </h2>
        <p className="text-muted-foreground/70 mt-1 max-w-sm text-sm">
          Esta sección mostrará todos los planes de mantenimiento activos. Accedé al plan de una
          propiedad específica desde la sección de Propiedades.
        </p>
      </div>
    </PageTransition>
  );
}
