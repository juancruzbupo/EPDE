'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useDashboardStats, useDashboardActivity } from '@/hooks/use-dashboard';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Home, AlertTriangle, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  if (!isAdmin) {
    return <ClientDashboard userName={user?.name ?? ''} />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general de la plataforma" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
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
            <StatCard title="Tareas Vencidas" value={stats.overdueTasks} icon={AlertTriangle} />
            <StatCard
              title="Presupuestos Pendientes"
              value={stats.pendingBudgets}
              icon={FileText}
            />
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
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.description}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(item.timestamp), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sin actividad reciente</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClientDashboard({ userName }: { userName: string }) {
  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${userName}`}
        description="Resumen de tus propiedades y tareas"
      />
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Acá vas a ver el resumen de tus propiedades y tareas de mantenimiento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
