'use client';

import Link from 'next/link';
import { useClientDashboardStats, useClientUpcomingTasks } from '@/hooks/use-dashboard';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Home,
  AlertTriangle,
  FileText,
  Wrench,
  Clock,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { TASK_PRIORITY_LABELS } from '@epde/shared';
import { priorityColors } from '@/lib/style-maps';

export function ClientDashboard({ userName }: { userName: string }) {
  const { data: stats, isLoading: statsLoading } = useClientDashboardStats();
  const { data: upcoming, isLoading: upcomingLoading } = useClientUpcomingTasks();

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${userName}`}
        description="Resumen de tus propiedades y tareas"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
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
            <StatCard title="Presupuestos" value={stats.pendingBudgets} icon={FileText} />
            <StatCard title="Servicios Abiertos" value={stats.openServices} icon={Wrench} />
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
