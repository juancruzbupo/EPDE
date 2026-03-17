'use client';

import type { DashboardStats } from '@epde/shared';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM, useMotionPreference } from '@/lib/motion';

interface AttentionNeededProps {
  stats: DashboardStats;
}

interface AttentionItem {
  label: string;
  count: number;
  href: string;
  severity: 'urgent' | 'warning';
}

function buildItems(stats: DashboardStats): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (stats.pendingBudgets > 0) {
    items.push({
      label: `${stats.pendingBudgets} presupuesto${stats.pendingBudgets !== 1 ? 's' : ''} pendiente${stats.pendingBudgets !== 1 ? 's' : ''} de respuesta`,
      count: stats.pendingBudgets,
      href: '/budgets?status=PENDING',
      severity: 'warning',
    });
  }

  if (stats.pendingServices > 0) {
    items.push({
      label: `${stats.pendingServices} solicitud${stats.pendingServices !== 1 ? 'es' : ''} de servicio abierta${stats.pendingServices !== 1 ? 's' : ''}`,
      count: stats.pendingServices,
      href: '/service-requests?status=OPEN',
      severity: 'warning',
    });
  }

  if (stats.overdueTasks > 0) {
    items.push({
      label: `${stats.overdueTasks} tarea${stats.overdueTasks !== 1 ? 's' : ''} vencida${stats.overdueTasks !== 1 ? 's' : ''}`,
      count: stats.overdueTasks,
      href: '/tasks?status=OVERDUE',
      severity: 'urgent',
    });
  }

  return items;
}

export function AttentionNeeded({ stats }: AttentionNeededProps) {
  const { shouldAnimate } = useMotionPreference();
  const Wrapper = shouldAnimate ? motion.div : 'div';
  const Item = shouldAnimate ? motion.div : 'div';

  const items = buildItems(stats);

  if (items.length === 0) {
    return (
      <Wrapper
        {...(shouldAnimate ? { variants: FADE_IN_UP, initial: 'hidden', animate: 'visible' } : {})}
      >
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="text-success h-8 w-8" />
              <p className="type-title-sm text-foreground">Todo al día</p>
              <p className="type-body-sm text-muted-foreground">
                No hay acciones pendientes que requieran atención.
              </p>
            </div>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      {...(shouldAnimate ? { variants: FADE_IN_UP, initial: 'hidden', animate: 'visible' } : {})}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="type-title-md">Necesitan atención</CardTitle>
        </CardHeader>
        <CardContent>
          <Wrapper
            className="space-y-2"
            {...(shouldAnimate
              ? { variants: STAGGER_CONTAINER, initial: 'hidden', animate: 'visible' }
              : {})}
          >
            {items.map((item) => {
              const Icon = item.severity === 'urgent' ? AlertTriangle : AlertCircle;
              const iconColor = item.severity === 'urgent' ? 'text-destructive' : 'text-warning';

              return (
                <Item key={item.href} {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
                  <Link
                    href={item.href}
                    className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
                    <span className="type-body-md text-foreground flex-1">{item.label}</span>
                    <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                  </Link>
                </Item>
              );
            })}
          </Wrapper>
        </CardContent>
      </Card>
    </Wrapper>
  );
}
