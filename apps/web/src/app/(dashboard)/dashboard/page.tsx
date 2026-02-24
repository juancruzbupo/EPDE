'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useDashboardStats, useDashboardActivity } from '@/hooks/use-dashboard';
import { useClientDashboardStats, useClientUpcomingTasks } from '@/hooks/use-dashboard';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Home,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { TASK_PRIORITY_LABELS } from '@epde/shared';

const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

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
  const { data: stats, isLoading: statsLoading } = useClientDashboardStats();
  const { data: upcoming, isLoading: upcomingLoading } = useClientUpcomingTasks();

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${userName}`}
        description="Resumen de tus propiedades y tareas"
      />

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
            <StatCard title="Propiedades" value={stats.totalProperties} icon={Home} />
            <StatCard title="Tareas Pendientes" value={stats.pendingTasks} icon={Clock} />
            <StatCard
              title="Tareas Vencidas"
              value={stats.overdueTasks}
              icon={AlertTriangle}
              className={stats.overdueTasks > 0 ? 'border-red-200 bg-red-50' : ''}
            />
            <StatCard
              title="Completadas este mes"
              value={stats.completedThisMonth}
              icon={CheckCircle}
            />
          </>
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Próximas Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : upcoming && upcoming.length > 0 ? (
            <div className="space-y-2">
              {upcoming.map((task) => {
                const isOverdue = new Date(task.nextDueDate) < new Date();
                return (
                  <Link
                    key={task.id}
                    href={`/properties/${task.maintenancePlanId}?tab=plan`}
                    className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {task.categoryName}
                        </Badge>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs ${priorityColors[task.priority] ?? ''}`}
                        >
                          {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                        <span>{task.propertyAddress}</span>
                        <span>·</span>
                        <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                          {formatDistanceToNow(new Date(task.nextDueDate), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No tenés tareas próximas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
