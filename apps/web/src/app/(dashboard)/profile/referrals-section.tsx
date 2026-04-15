'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReferrals } from '@/hooks/use-referrals';

/**
 * "Programa de Recomendación" section on the profile page. PR G scaffolds
 * the hook wiring + loading/error shell. PR H fills in the stats card and
 * milestone stepper. PR I adds the share actions and history list.
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

  // PR H + I fill in the actual UI — this placeholder keeps the anchor live
  // so email CTAs don't land on a blank page while the section is in progress.
  return (
    <section id="recomendaciones" aria-label="Programa de recomendación" className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Tu código de recomendación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-primary font-mono text-2xl font-bold tracking-wide">
            {data.referralCode}
          </p>
          <p className="text-muted-foreground type-body-sm">
            {data.stats.convertedCount} conversiones de {data.stats.totalReferrals} recomendaciones.
            {data.stats.nextMilestone !== null && (
              <> Próximo hito: {data.stats.nextMilestone} conversiones.</>
            )}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
