'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStats, useDashboardActivity } from '@/hooks/use-dashboard';
import { staggerContainer, staggerItem, fadeInUp, useMotionPreference } from '@/lib/motion';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Home, AlertTriangle, FileText, Wrench, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();
  const { shouldAnimate } = useMotionPreference();

  const Wrapper = shouldAnimate ? motion.div : 'div';
  const Item = shouldAnimate ? motion.div : 'div';

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general de la plataforma" />

      <Wrapper
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        {...(shouldAnimate
          ? { variants: staggerContainer, initial: 'hidden', animate: 'visible' }
          : {})}
      >
        <AnimatePresence mode="wait">
          {statsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
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
                  title="Clientes"
                  value={<AnimatedNumber value={stats.totalClients} />}
                  icon={Users}
                />
              </Item>
              <Item {...(shouldAnimate ? { variants: staggerItem } : {})}>
                <StatCard
                  title="Propiedades"
                  value={<AnimatedNumber value={stats.totalProperties} />}
                  icon={Home}
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
                  title="Presupuestos Pendientes"
                  value={<AnimatedNumber value={stats.pendingBudgets} />}
                  icon={FileText}
                />
              </Item>
              <Item {...(shouldAnimate ? { variants: staggerItem } : {})}>
                <StatCard
                  title="Servicios Pendientes"
                  value={<AnimatedNumber value={stats.pendingServices} />}
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
            <CardTitle className="text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonShimmer key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <Wrapper
                className="space-y-3"
                {...(shouldAnimate
                  ? { variants: staggerContainer, initial: 'hidden', animate: 'visible' }
                  : {})}
              >
                <ul className="space-y-3">
                  {activity.map((item) => (
                    <Item key={item.id} {...(shouldAnimate ? { variants: staggerItem } : {})}>
                      <li className="flex items-start gap-3 rounded-lg border p-3">
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
                    </Item>
                  ))}
                </ul>
              </Wrapper>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <Activity className="text-muted-foreground/50 h-8 w-8" />
                <p className="text-muted-foreground text-sm">Sin actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
