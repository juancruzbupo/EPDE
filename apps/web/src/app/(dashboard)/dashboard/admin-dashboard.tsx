'use client';

import { useDashboardStats, useDashboardActivity } from '@/hooks/use-dashboard';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Home, AlertTriangle, FileText, Wrench, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general de la plataforma" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <StatCard title="Clientes" value={stats.totalClients} icon={Users} />
            <StatCard title="Propiedades" value={stats.totalProperties} icon={Home} />
            <StatCard
              title="Tareas Vencidas"
              value={stats.overdueTasks}
              icon={AlertTriangle}
              className={stats.overdueTasks > 0 ? 'border-destructive/30 bg-destructive/10' : ''}
            />
            <StatCard
              title="Presupuestos Pendientes"
              value={stats.pendingBudgets}
              icon={FileText}
            />
            <StatCard title="Servicios Pendientes" value={stats.pendingServices} icon={Wrench} />
          </>
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : activity && activity.length > 0 ? (
            <ul className="space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="bg-muted mt-0.5 rounded-full p-2">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.description}</span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <Activity className="text-muted-foreground/50 h-8 w-8" />
              <p className="text-muted-foreground text-sm">Sin actividad reciente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
