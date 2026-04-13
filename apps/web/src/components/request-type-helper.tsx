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

export function RequestTypeInlineHelper() {
  return (
    <div className="bg-muted/30 border-border mb-4 rounded-lg border p-3">
      <p className="type-body-sm mb-1 font-medium">¿Presupuesto o solicitud?</p>
      <div className="text-muted-foreground type-body-sm space-y-0.5">
        <p>
          <strong>Presupuesto:</strong> Sabés qué necesitás y querés un precio.
        </p>
        <p>
          <strong>Solicitud:</strong> Detectaste algo y querés que EPDE lo evalúe.
        </p>
      </div>
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
                <ClipboardList className="text-primary h-5 w-5" />
                <p className="font-semibold">Pedir cotización (Presupuesto)</p>
              </div>
              <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                Sabés qué reparación necesitás y querés saber cuánto cuesta. EPDE te envía el
                detalle de costos.
              </p>
              <p className="text-muted-foreground mb-3 text-xs italic">
                Ejemplo: &ldquo;Las canaletas están rotas, ¿cuánto sale repararlas?&rdquo;
              </p>
              <Button asChild size="sm" className="w-full">
                <Link href="/budgets?action=create">Solicitar presupuesto</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Wrench className="text-primary h-5 w-5" />
                <p className="font-semibold">Reportar un problema (Solicitud)</p>
              </div>
              <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                Detectaste algo raro y necesitás que EPDE lo evalúe y te diga qué hacer.
              </p>
              <p className="text-muted-foreground mb-3 text-xs italic">
                Ejemplo: &ldquo;Hay humedad en la pared, no sé de dónde viene.&rdquo;
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/service-requests?action=create">Crear solicitud de servicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
