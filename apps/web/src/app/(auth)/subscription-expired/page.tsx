'use client';

import { WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

export default function SubscriptionExpiredPage() {
  return (
    <div role="alert" className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {/* Badge de urgencia arriba — Norma (68) necesita entender a primera
            vista que hay una acción requerida. Antes veía solo un reloj y
            texto descriptivo, ahora arranca con un badge rojo que no
            deja ambigüedad. */}
        <span className="bg-destructive text-destructive-foreground type-label-sm mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold tracking-wider uppercase">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Acción requerida
        </span>
        <div className="bg-destructive/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive h-10 w-10" />
        </div>
        <h1 className="type-title-lg mb-2">Tu acceso está bloqueado</h1>
        <p className="type-title-sm text-muted-foreground mb-2 font-medium">
          Tu suscripción a EPDE venció.
        </p>
        <p className="text-muted-foreground type-body-md mb-6">
          Contactanos por WhatsApp para renovarla y recuperar el acceso al diagnóstico, tareas y
          recordatorios de mantenimiento.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            variant="destructive"
            onClick={() => {
              window.open(
                `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=Hola, quiero renovar mi suscripción a EPDE`,
                '_blank',
              );
            }}
          >
            Renovar por WhatsApp
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              window.location.href = ROUTES.login;
            }}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
