'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReferrals } from '@/hooks/use-referrals';

import { ReferralsMilestoneStepper } from './referrals-milestone-stepper';
import { ReferralsStatsCard } from './referrals-stats-card';

/**
 * "Programa de Recomendación" section on the profile page. PR G scaffolded
 * the data fetch + loading/error shell. PR H adds the stats card and the
 * milestone stepper. PR I will add the share actions and history list.
 *
 * The `id="recomendaciones"` anchor is intentional — milestone emails
 * link to `/profile#recomendaciones` so the user lands scrolled into this
 * section when they click from their inbox.
 */
export function ReferralsSection() {
  const { data, isLoading, error } = useReferrals();

  if (isLoading) {
    return (
      <section id="recomendaciones" aria-label="Programa de recomendación" className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Programa de recomendación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section id="recomendaciones" aria-label="Programa de recomendación" className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Programa de recomendación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground type-body-sm">
              No pudimos cargar tu código de recomendación. Actualizá la página e intentá de nuevo.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  // PR I adds the share actions card + history list above the stepper.
  return (
    <section id="recomendaciones" aria-label="Programa de recomendación" className="mb-6 space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Tu código de recomendación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-primary font-mono text-2xl font-bold tracking-wide">
            {data.referralCode}
          </p>
          <p className="text-muted-foreground type-body-sm">
            Compartilo con amigos que quieran cuidar su casa con EPDE. Cuando paguen su diagnóstico
            mencionando tu código, ganás meses de suscripción gratis.
          </p>
        </CardContent>
      </Card>

      <ReferralsStatsCard stats={data.stats} />

      <ReferralsMilestoneStepper
        milestones={data.milestones}
        convertedCount={data.stats.convertedCount}
      />
    </section>
  );
}
