'use client';

import { WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import { Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

export default function SubscriptionExpiredPage() {
  return (
    <div role="alert" className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="bg-destructive/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <Clock className="text-destructive h-8 w-8" />
        </div>
        <h1 className="type-title-lg mb-2">Tu suscripción expiró</h1>
        <p className="text-muted-foreground type-body-md mb-6">
          Tu período de acceso a EPDE finalizó. Para seguir usando la plataforma, contactá al
          administrador para renovar tu suscripción.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={() => {
              window.open(
                `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=Hola, quiero renovar mi suscripción a EPDE`,
                '_blank',
              );
            }}
          >
            Contactar por WhatsApp
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
