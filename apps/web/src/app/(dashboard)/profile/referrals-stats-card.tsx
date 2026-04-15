'use client';

import type { ReferralStats } from '@epde/shared';
import { Award, Calendar, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface ReferralsStatsCardProps {
  stats: ReferralStats;
}

/**
 * 4-up stats grid for the referral program. Mobile-first: 2 columns
 * stacked on small screens, 4 across at sm breakpoint.
 *
 * The "próximo hito" tile shows the gap when there's still room to
 * grow, and a "Llegaste al tope" copy when the user is past the
 * 10-conversion cap.
 */
export function ReferralsStatsCard({ stats }: ReferralsStatsCardProps) {
  const remaining =
    stats.nextMilestone !== null ? Math.max(0, stats.nextMilestone - stats.convertedCount) : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={Users}
            label="Recomendaciones"
            value={stats.totalReferrals}
            hint="Total registradas"
          />
          <Stat
            icon={TrendingUp}
            label="Conversiones"
            value={stats.convertedCount}
            hint="Pagaron diagnóstico"
          />
          <Stat
            icon={Calendar}
            label="Meses ganados"
            value={stats.creditsEarned.months}
            hint="Crédito en suscripción"
          />
          <Stat
            icon={Award}
            label="Próximo hito"
            value={remaining ?? '—'}
            hint={
              remaining === null
                ? 'Llegaste al tope'
                : remaining === 0
                  ? 'Hito alcanzado'
                  : `Te falta${remaining === 1 ? '' : 'n'} ${remaining} para el siguiente premio`
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface StatProps {
  icon: typeof Users;
  label: string;
  value: number | string;
  hint: string;
}

function Stat({ icon: Icon, label, value, hint }: StatProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="type-label-sm">{label}</span>
      </div>
      <p className="type-number-md text-foreground tabular-nums">{value}</p>
      <p className="type-body-sm text-muted-foreground/80 leading-tight">{hint}</p>
    </div>
  );
}
