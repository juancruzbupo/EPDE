'use client';

import { PageHeader } from '@/components/page-header';
import { PageTransition } from '@/components/ui/page-transition';
import { CheckSquare } from 'lucide-react';

export default function TareasPage() {
  return (
    <PageTransition>
      <PageHeader
        title="Tareas"
        description="Seguimiento de todas las tareas de mantenimiento pendientes, próximas y vencidas."
      />

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckSquare className="text-muted-foreground/40 mb-4 h-12 w-12" />
        <h2 className="text-muted-foreground text-lg font-medium">
          Vista global de tareas en construcción
        </h2>
        <p className="text-muted-foreground/70 mt-1 max-w-sm text-sm">
          Esta sección consolidará las tareas de mantenimiento de todas las propiedades. Por ahora,
          accedé a las tareas desde el plan de mantenimiento de cada propiedad.
        </p>
      </div>
    </PageTransition>
  );
}
