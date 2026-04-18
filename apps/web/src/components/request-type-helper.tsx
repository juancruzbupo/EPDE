'use client';

import { ClipboardList, HelpCircle, Wrench } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ROUTES } from '@/lib/routes';

export function ServiceRequestInlineHelper() {
  return (
    <div className="bg-muted/30 border-border mb-4 rounded-lg border p-3">
      <p className="text-muted-foreground type-body-sm">
        <strong className="text-foreground">Solicitud de servicio:</strong> pedí que EPDE ejecute
        una tarea de mantenimiento por vos. Puede ser algo del plan, algo que requiere profesional,
        o un problema nuevo.
        <span className="italic">
          {' '}
          Ej: &quot;Necesito que revisen la instalación eléctrica&quot;, &quot;Quiero que limpien
          las canaletas&quot;, &quot;Apareció humedad en la pared&quot;.
        </span>
      </p>
    </div>
  );
}

export function BudgetInlineHelper() {
  return (
    <div className="bg-muted/30 border-border mb-4 rounded-lg border p-3">
      <p className="text-muted-foreground type-body-sm">
        <strong className="text-foreground">Presupuesto:</strong> cotización para un trabajo de
        arquitectura fuera del mantenimiento.
        <span className="italic">
          {' '}
          Ej: &quot;Quiero ampliar la cocina&quot;, &quot;Necesito un plano para la
          municipalidad&quot;, &quot;¿Cuánto sale remodelar el baño?&quot;.
        </span>
      </p>
    </div>
  );
}

export function RequestTypeHelper() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs">
          <HelpCircle className="h-3.5 w-3.5" />
          ¿Presupuesto o solicitud?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>¿Qué necesitás?</DialogTitle>
          <DialogDescription>Elegí la opción que mejor describe tu situación.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Wrench className="text-primary h-5 w-5" />
                <p className="font-semibold">Solicitud de servicio</p>
              </div>
              <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
                Pedí que EPDE ejecute una tarea de mantenimiento por vos. Puede ser algo del plan
                que necesita profesional, algo que preferís delegar, o un problema nuevo.
              </p>
              <p className="text-muted-foreground mb-3 text-xs italic">
                Ej: &quot;Necesito que revisen la instalación eléctrica&quot;, &quot;Quiero que
                limpien las canaletas&quot;, &quot;Apareció humedad en la pared&quot;.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href={ROUTES.newServiceRequest}>Crear solicitud de servicio</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <ClipboardList className="text-primary h-5 w-5" />
                <p className="font-semibold">Presupuesto</p>
              </div>
              <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
                Un trabajo de arquitectura que no es mantenimiento. EPDE te envía la cotización con
                detalle de costos y alcance del proyecto.
              </p>
              <p className="text-muted-foreground mb-3 text-xs italic">
                Ej: &quot;Quiero ampliar la cocina&quot;, &quot;Necesito un plano para la
                municipalidad&quot;, &quot;¿Cuánto sale remodelar el baño?&quot;.
              </p>
              <Button asChild size="sm" className="w-full">
                <Link href={ROUTES.newBudget}>Solicitar presupuesto</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
