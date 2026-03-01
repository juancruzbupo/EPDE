'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientDashboardStats, useClientUpcomingTasks } from '@/hooks/use-dashboard';
import { staggerContainer, staggerItem, fadeInUp, useMotionPreference } from '@/lib/motion';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { HealthCard } from '@/components/health-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const { shouldAnimate } = useMotionPreference();

  const Wrapper = shouldAnimate ? motion.div : 'div';
  const Item = shouldAnimate ? motion.div : 'div';

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${userName}`}
        description="Resumen de tus propiedades y tareas"
      />

      {stats && (
        <div className="mb-4">
          <HealthCard
            totalTasks={stats.pendingTasks + stats.overdueTasks + stats.completedThisMonth}
            completedTasks={stats.completedThisMonth}
            overdueTasks={stats.overdueTasks}
          />
        </div>
      )}

      <Wrapper
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        {...(shouldAnimate
          ? { variants: staggerContainer, initial: 'hidden', animate: 'visible' }
          : {})}
      >
        <AnimatePresence mode="wait">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Item key={`skel-${i}`} {...(shouldAnimate ? { variants: staggerItem } : {})}>
                <Card>
                  <CardContent className="p-6">
                    <SkeletonShimmer className="h-20 w-full" />
                  </CardContent>
                </Card>
              </Item>
            ))
          ) : stats ? (
            <>
              <Item {...(shouldAnimate ? { variants: staggerItem } : {})}>
                <StatCard
                  title="Propiedades"
                  value={<AnimatedNumber value={stats.totalProperties} />}
                  icon={Home}
                />
              </Item>
              <Item {...(shouldAnimate ? { variants: staggerItem } : {})}>
                <StatCard
                  title="Tareas Pendientes"
                  value={<AnimatedNumber value={stats.pendingTasks} />}
                  icon={Clock}
                />
              </Item>
              <Item {...(shouldAnimate ? { variants: staggerItem } : {})}>
                <StatCard
                  title="Tareas Vencidas"
                  value={<AnimatedNumber value={stats.overdueTasks} />}
                  icon={AlertTriangle}
                  className={
                    stats.overdueTasks > 0 ? 'border-destructive/30 bg-destructive/10' : ''
                  }
                />
              </Item>
              <Item {...(shouldAnimate ? { variants: staggerItem } : {})}>
                <StatCard
                  title="Completadas este mes"
                  value={<AnimatedNumber value={stats.completedThisMonth} />}
                  icon={CheckCircle}
                />
              </Item>
              <Item {...(shouldAnimate ? { variants: staggerItem } : {})}>
                <StatCard
                  title="Presupuestos"
                  value={<AnimatedNumber value={stats.pendingBudgets} />}
                  icon={FileText}
                />
              </Item>
              <Item {...(shouldAnimate ? { variants: staggerItem } : {})}>
                <StatCard
                  title="Servicios Abiertos"
                  value={<AnimatedNumber value={stats.openServices} />}
                  icon={Wrench}
                />
              </Item>
            </>
          ) : null}
        </AnimatePresence>
      </Wrapper>

      <motion.div
        {...(shouldAnimate ? { variants: fadeInUp, initial: 'hidden', animate: 'visible' } : {})}
      >
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Proximas Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonShimmer key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : upcoming && upcoming.length > 0 ? (
              <Wrapper
                {...(shouldAnimate
                  ? { variants: staggerContainer, initial: 'hidden', animate: 'visible' }
                  : {})}
              >
                <ul className="space-y-2">
                  {upcoming.map((task) => {
                    const isOverdue = task.nextDueDate
                      ? new Date(task.nextDueDate) < new Date()
                      : false;
                    return (
                      <Item key={task.id} {...(shouldAnimate ? { variants: staggerItem } : {})}>
                        <li>
                          <Link
                            href={`/properties/${task.propertyId}?tab=plan`}
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
                                <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                                  {task.nextDueDate
                                    ? formatDistanceToNow(new Date(task.nextDueDate), {
                                        addSuffix: true,
                                        locale: es,
                                      })
                                    : 'Segun deteccion'}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="text-muted-foreground h-4 w-4" />
                          </Link>
                        </li>
                      </Item>
                    );
                  })}
                </ul>
              </Wrapper>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <CheckCircle className="text-muted-foreground/50 h-8 w-8" />
                <p className="text-muted-foreground text-sm">No tenes tareas proximas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
