import type { AdminAnalytics, DashboardStats } from '@epde/shared';
import { Home, TrendingUp, Users } from 'lucide-react';
import React from 'react';

import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KpiSummaryCardProps {
  stats: DashboardStats;
  analytics: AdminAnalytics | undefined;
}

export const KpiSummaryCard = React.memo(function KpiSummaryCard({
  stats,
  analytics,
}: KpiSummaryCardProps) {
  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-default items-center gap-2">
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
              </TooltipTrigger>
              <TooltipContent>Clientes activos registrados en el sistema</TooltipContent>
            </Tooltip>

            <span className="text-muted-foreground hidden sm:inline">·</span>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-default items-center gap-2">
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
              </TooltipTrigger>
              <TooltipContent>Viviendas con diagnóstico cargado</TooltipContent>
            </Tooltip>

            <span className="text-muted-foreground hidden sm:inline">·</span>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-default items-center gap-2">
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
              </TooltipTrigger>
              <TooltipContent>
                Porcentaje de tareas completadas a tiempo sobre el total
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});
