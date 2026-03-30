import type { AdminAnalytics, DashboardStats } from '@epde/shared';
import { Home, TrendingUp, Users } from 'lucide-react';
import React from 'react';

import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card, CardContent } from '@/components/ui/card';

interface KpiSummaryCardProps {
  stats: DashboardStats;
  analytics: AdminAnalytics | undefined;
}

export const KpiSummaryCard = React.memo(function KpiSummaryCard({
  stats,
  analytics,
}: KpiSummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-2">
              <Users className="text-primary h-4 w-4" />
            </div>
            <div>
              <p className="type-number-md text-foreground">
                <AnimatedNumber value={stats.totalClients} />
              </p>
              <p className="type-label-sm text-muted-foreground">Clientes</p>
            </div>
          </div>

          <span className="text-muted-foreground hidden sm:inline">·</span>

          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-2">
              <Home className="text-primary h-4 w-4" />
            </div>
            <div>
              <p className="type-number-md text-foreground">
                <AnimatedNumber value={stats.totalProperties} />
              </p>
              <p className="type-label-sm text-muted-foreground">Propiedades</p>
            </div>
          </div>

          <span className="text-muted-foreground hidden sm:inline">·</span>

          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-2">
              <TrendingUp className="text-primary h-4 w-4" />
            </div>
            <div>
              {analytics ? (
                <p
                  className={`type-number-md ${
                    analytics.completionRate >= 80
                      ? 'text-success'
                      : analytics.completionRate >= 60
                        ? 'text-warning'
                        : 'text-destructive'
                  }`}
                >
                  {analytics.completionRate}%
                </p>
              ) : (
                <p className="type-number-md text-muted-foreground">—</p>
              )}
              <p className="type-label-sm text-muted-foreground">Tasa de completado</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
