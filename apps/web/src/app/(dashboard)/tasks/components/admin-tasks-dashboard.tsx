'use client';

import type { TaskListItem } from '@epde/shared';
import { TaskStatus } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Clock, MessageCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { markPropertyContacted } from '@/lib/api/properties';
import { ROUTES } from '@/lib/routes';

interface AdminTasksDashboardProps {
  tasks: TaskListItem[] | undefined;
  isLoading: boolean;
}

interface PropertyGroup {
  propertyId: string;
  address: string;
  city: string;
  overdue: number;
  urgent: number;
  pending: number;
  total: number;
  completionPct: number;
  lastContactedAt: string | null;
  worstTask: TaskListItem | null;
}

const COOLDOWN_MS = 7 * 24 * 60 * 60_000;

function buildWhatsAppUrl(group: PropertyGroup): string {
  const overdueWord = group.overdue === 1 ? 'tarea pendiente' : 'tareas pendientes';
  const message = [
    `Hola! Soy tu asesora de EPDE.`,
    `Veo que tenés ${group.overdue} ${overdueWord} en ${group.address}.`,
    `¿Necesitás asesoramiento para realizarlas o hay algo que te esté trabando?`,
    `Estoy para ayudarte.`,
  ].join(' ');
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function AdminTasksDashboard({ tasks, isLoading }: AdminTasksDashboardProps) {
  const [contactUpdates, setContactUpdates] = useState<Record<string, string>>({});

  const handleContact = useCallback(async (group: PropertyGroup) => {
    window.open(buildWhatsAppUrl(group), '_blank');
    try {
      await markPropertyContacted(group.propertyId);
      setContactUpdates((prev) => ({ ...prev, [group.propertyId]: new Date().toISOString() }));
    } catch {
      // Best-effort — WhatsApp already opened, log failure is non-critical
    }
  }, []);

  const { groups, kpis } = useMemo(() => {
    if (!tasks) return { groups: [], kpis: null };

    const map = new Map<string, PropertyGroup>();
    let totalOverdue = 0;
    let totalOnTrack = 0;
    let totalUrgent = 0;

    for (const task of tasks) {
      const prop = task.maintenancePlan.property;
      let group = map.get(prop.id);
      if (!group) {
        group = {
          propertyId: prop.id,
          address: prop.address,
          city: prop.city,
          overdue: 0,
          urgent: 0,
          pending: 0,
          total: 0,
          completionPct: 0,
          lastContactedAt: contactUpdates[prop.id] ?? null,
          worstTask: null,
        };
        map.set(prop.id, group);
      }

      group.total++;
      if (task.status === TaskStatus.OVERDUE) {
        group.overdue++;
        totalOverdue++;
        if (task.priority === 'URGENT' || task.priority === 'HIGH') {
          group.urgent++;
          totalUrgent++;
        }
        if (
          !group.worstTask ||
          (task.nextDueDate &&
            group.worstTask.nextDueDate &&
            new Date(task.nextDueDate) < new Date(group.worstTask.nextDueDate))
        ) {
          group.worstTask = task;
        }
      } else if (task.status === TaskStatus.PENDING || task.status === TaskStatus.UPCOMING) {
        group.pending++;
        totalOnTrack++;
      }
    }

    // "Al día" = tasks NOT overdue. Completion % = on-track / total.
    // In the cyclic model, COMPLETED status is transient (tasks reset to
    // PENDING with new date), so counting COMPLETED is always ~0. Instead
    // we measure "what % of tasks are NOT overdue" — that's the real
    // operational health metric.
    for (const group of map.values()) {
      group.completionPct =
        group.total > 0 ? Math.round(((group.total - group.overdue) / group.total) * 100) : 100;
    }

    const sortedGroups = [...map.values()].sort((a, b) => {
      if (a.overdue !== b.overdue) return b.overdue - a.overdue;
      return a.completionPct - b.completionPct;
    });

    return {
      groups: sortedGroups,
      kpis: {
        totalTasks: tasks.length,
        totalOverdue,
        totalUrgent,
        totalOnTrack,
        completionRate:
          tasks.length > 0 ? Math.round(((tasks.length - totalOverdue) / tasks.length) * 100) : 0,
        propertiesWithOverdue: sortedGroups.filter((g) => g.overdue > 0).length,
      },
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      {kpis && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            icon={<AlertTriangle className="text-destructive h-5 w-5" />}
            label="Vencidas"
            value={kpis.totalOverdue}
            variant={kpis.totalOverdue > 0 ? 'destructive' : 'default'}
          />
          <KpiCard
            icon={<Clock className="text-warning h-5 w-5" />}
            label="Urgentes"
            value={kpis.totalUrgent}
            variant={kpis.totalUrgent > 0 ? 'warning' : 'default'}
          />
          <KpiCard
            icon={<CheckCircle2 className="text-success h-5 w-5" />}
            label="Al día"
            value={kpis.totalOnTrack}
            variant="default"
          />
          <KpiCard
            icon={<TrendingUp className="text-primary h-5 w-5" />}
            label="Tasa de cumplimiento"
            value={`${kpis.completionRate}%`}
            variant="default"
          />
        </div>
      )}

      {/* Properties needing attention */}
      {groups.some((g) => g.overdue > 0) && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="type-title-md text-destructive">
              Propiedades que necesitan atención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groups
                .filter((g) => g.overdue > 0)
                .map((group) => (
                  <div
                    key={group.propertyId}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <Link
                      href={ROUTES.property(group.propertyId, { tab: 'plan' })}
                      className="hover:text-primary min-w-0 flex-1 transition-colors"
                    >
                      <p className="text-sm font-medium">{group.address}</p>
                      <p className="text-muted-foreground text-xs">{group.city}</p>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="destructive">
                        {group.overdue} vencida{group.overdue !== 1 ? 's' : ''}
                      </Badge>
                      {group.urgent > 0 && (
                        <Badge variant="warning">
                          {group.urgent} urgente{group.urgent !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {group.completionPct}%
                      </span>
                      <WhatsAppButton group={group} onContact={handleContact} />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All properties overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="type-title-md">Todas las propiedades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {groups.map((group) => (
              <Link
                key={group.propertyId}
                href={ROUTES.property(group.propertyId, { tab: 'plan' })}
                className="hover:bg-muted/40 flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{group.address}</p>
                  <p className="text-muted-foreground text-xs">{group.city}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-muted h-2 w-20 overflow-hidden rounded-full sm:w-32">
                    <div
                      className={`h-full rounded-full transition-all ${
                        group.overdue > 0 ? 'bg-destructive' : 'bg-success'
                      }`}
                      style={{ width: `${group.completionPct}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                    {group.completionPct}%
                  </span>
                </div>
              </Link>
            ))}
            {groups.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No hay propiedades con tareas asignadas.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Link to full task list */}
      <div className="text-center">
        <Button variant="outline" size="sm" asChild>
          <Link href="/tasks?view=list">Ver listado completo de tareas</Link>
        </Button>
      </div>
    </div>
  );
}

function WhatsAppButton({
  group,
  onContact,
}: {
  group: PropertyGroup;
  onContact: (group: PropertyGroup) => void;
}) {
  const lastContact = group.lastContactedAt ? new Date(group.lastContactedAt) : null;
  const inCooldown = lastContact ? Date.now() - lastContact.getTime() < COOLDOWN_MS : false;

  if (inCooldown && lastContact) {
    const ago = formatDistanceToNow(lastContact, { addSuffix: true, locale: es });
    return (
      <span
        className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
        title={`Contactado ${ago}. Esperá unos días para no ser insistente.`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Contactado {ago}
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onContact(group);
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#20BD5A]"
      aria-label={`Contactar por WhatsApp sobre ${group.address}`}
    >
      <MessageCircle className="h-3.5 w-3.5" />
      Contactar
    </button>
  );
}

function KpiCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  variant: 'destructive' | 'warning' | 'default';
}) {
  const borderColor =
    variant === 'destructive'
      ? 'border-destructive/30'
      : variant === 'warning'
        ? 'border-warning/30'
        : 'border-border';

  return (
    <Card className={borderColor}>
      <CardContent className="flex items-center gap-3 p-4">
        {icon}
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
