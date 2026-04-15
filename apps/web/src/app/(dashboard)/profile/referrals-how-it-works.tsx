import { Gift, MessageSquareShare, ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Minimal 3-step explainer for the referral program. Deliberately short
 * — the stats + stepper carry the motivational load; this card is just
 * the "how does this work" reference that answers the question without
 * making the user read an FAQ.
 */
export function ReferralsHowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-title-md">¿Cómo funciona?</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          <Step
            icon={MessageSquareShare}
            number={1}
            title="Compartí tu código"
            description="Con amigos o familiares que tengan casa y quieran cuidarla."
          />
          <Step
            icon={ShieldCheck}
            number={2}
            title="Se registran con tu código"
            description="Al contactarse con EPDE mencionan tu código y pagan su diagnóstico con 10% de descuento."
          />
          <Step
            icon={Gift}
            number={3}
            title="Ganás crédito automáticamente"
            description="Sumás meses de suscripción gratis según cuántos se sumen — sin caducidad."
          />
        </ol>
      </CardContent>
    </Card>
  );
}

interface StepProps {
  icon: typeof Gift;
  number: number;
  title: string;
  description: string;
}

function Step({ icon: Icon, number, title, description }: StepProps) {
  return (
    <li className="flex items-start gap-3">
      <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="type-label-lg text-foreground">
          {number}. {title}
        </p>
        <p className="type-body-sm text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}
