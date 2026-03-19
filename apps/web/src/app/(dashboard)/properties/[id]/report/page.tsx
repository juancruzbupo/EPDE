'use client';

import type { ConditionFound, TaskPriority } from '@epde/shared';
import {
  ACTION_TAKEN_LABELS,
  CONDITION_FOUND_LABELS,
  formatRelativeDate,
  PROFESSIONAL_REQUIREMENT_LABELS,
  PROPERTY_SECTOR_LABELS,
  PROPERTY_TYPE_LABELS,
  QUERY_KEYS,
  TASK_PRIORITY_LABELS,
  TASK_RESULT_LABELS,
} from '@epde/shared';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect } from 'react';

import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { getPropertyReport } from '@/lib/api/properties';

// ─── Priority sorting (highest urgency first) ────────────

const PRIORITY_ORDER: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const CONDITION_SCORE: Record<ConditionFound, number> = {
  EXCELLENT: 100,
  GOOD: 80,
  FAIR: 60,
  POOR: 40,
  CRITICAL: 20,
};

// ─── Score helpers ────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 80) return 'text-success';
  if (s >= 60) return 'text-warning';
  if (s >= 40) return 'text-caution';
  return 'text-destructive';
}
function scoreBg(s: number) {
  if (s >= 80) return 'bg-success';
  if (s >= 60) return 'bg-warning';
  if (s >= 40) return 'bg-caution';
  return 'bg-destructive';
}
function scoreLabel(s: number) {
  if (s >= 80) return 'Excelente';
  if (s >= 60) return 'Bueno';
  if (s >= 40) return 'Regular';
  if (s >= 20) return 'Necesita atención';
  return 'Crítico';
}
function statusMessage(s: number) {
  if (s >= 80)
    return 'Tu vivienda está en excelente estado. El mantenimiento preventivo está funcionando correctamente.';
  if (s >= 60)
    return 'Tu vivienda está en buen estado general, pero hay aspectos que necesitan atención para evitar que se acumulen problemas.';
  if (s >= 40)
    return 'Tu vivienda necesita atención. Hay tareas pendientes que podrían generar reparaciones costosas si no se atienden pronto.';
  return 'Tu vivienda necesita atención urgente. Los problemas acumulados pueden derivar en reparaciones mayores. Te recomendamos actuar de inmediato.';
}

const DIM: Record<string, { label: string; hint: string }> = {
  compliance: { label: 'Cumplimiento', hint: 'Tareas completadas a tiempo' },
  condition: { label: 'Condición', hint: 'Estado general según inspecciones' },
  coverage: { label: 'Cobertura', hint: 'Sectores inspeccionados recientemente' },
  investment: { label: 'Inversión', hint: 'Proporción de acciones preventivas' },
  trend: { label: 'Tendencia', hint: 'Evolución reciente del estado' },
};

// ─── Small components ─────────────────────────────────────

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="bg-muted print:border-border h-3 w-full overflow-hidden rounded-full print:border">
      <div
        className={`h-full rounded-full ${className ?? scoreBg(value)}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="type-title-lg text-foreground font-heading mb-4 border-b pb-2">{children}</h2>
  );
}

// ─── Main ─────────────────────────────────────────────────

export default function PropertyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  useEffect(() => {
    document.title = 'Informe Técnico | EPDE';
  }, []);

  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.properties, id, 'report'],
    queryFn: ({ signal }) => getPropertyReport(id, signal).then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Cargando"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="text-muted-foreground text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <p>Generando informe técnico...</p>
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return <ErrorState message="No se pudo generar el informe" onRetry={refetch} />;
  }

  const {
    property,
    healthIndex,
    sectorBreakdown,
    categoryBreakdown,
    overdueTasks,
    upcomingTasks,
    recentLogs,
    taskStats,
  } = report;
  const sc = healthIndex.score;

  // Sort by priority/urgency
  const sortedOverdue = [...overdueTasks].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
  );
  const sortedCats = [...categoryBreakdown].sort(
    (a, b) => b.overdueTasks - a.overdueTasks || b.totalTasks - a.totalTasks,
  );
  const sortedSectors = [...sectorBreakdown]
    .map((s) => ({
      ...s,
      score: s.total > 0 ? Math.round(((s.total - s.overdue) / s.total) * 100) : 100,
    }))
    .sort((a, b) => a.score - b.score);
  const logsWithPhotos = recentLogs.filter((l) => l.photoUrl);

  return (
    <div className="report-container mx-auto max-w-4xl">
      {/* ── Sticky print bar (hidden in print) ── */}
      <div className="no-print bg-background/95 sticky top-0 z-10 mb-6 flex items-center justify-between border-b py-3 backdrop-blur">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/properties/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Volver
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          Imprimir / Descargar PDF
        </Button>
      </div>

      {/* ── 1. PORTADA ── */}
      <section className="report-section mb-10">
        <div className="mb-8 text-center">
          <p className="type-title-lg font-heading text-primary mb-1">EPDE</p>
          <h1 className="type-display-lg font-heading text-foreground mb-2">
            Informe Técnico de Diagnóstico Edilicio
          </h1>
          <p className="text-muted-foreground">
            {property.address}, {property.city}
          </p>
          <p className="text-muted-foreground text-sm">
            {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
            {property.yearBuilt ? ` · Año ${property.yearBuilt}` : ''}
            {property.squareMeters ? ` · ${property.squareMeters} m²` : ''}
          </p>
          {property.user && (
            <p className="text-muted-foreground mt-1 text-sm">Propietario: {property.user.name}</p>
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            Generado el{' '}
            {new Date().toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="bg-card border-border mx-auto max-w-md rounded-2xl border p-6 text-center">
          <p className="text-muted-foreground mb-1 text-sm">Índice de Salud de la Vivienda</p>
          <p className={`text-5xl font-bold ${scoreColor(sc)}`}>{sc}</p>
          <p className={`text-lg font-medium ${scoreColor(sc)}`}>{scoreLabel(sc)}</p>
          <div className="mt-2">
            <Bar value={sc} className={scoreBg(sc)} />
          </div>
        </div>
      </section>

      {/* ── 2. RESUMEN EJECUTIVO ── */}
      <section className="report-section mb-10 print:break-before-page">
        <Title>Resumen Ejecutivo</Title>
        <div className="bg-muted/40 mb-6 rounded-xl p-5">
          <p className="type-body-md text-foreground leading-relaxed">{statusMessage(sc)}</p>
        </div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          {(Object.entries(healthIndex.dimensions) as [string, number][]).map(([k, v]) => {
            const d = DIM[k];
            if (!d) return null;
            return (
              <div key={k} className="report-item space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className={`text-sm font-bold ${scoreColor(v)}`}>{v}/100</p>
                </div>
                <Bar value={v} />
                <p className="text-muted-foreground text-xs">{d.hint}</p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-4 gap-3 print:grid-cols-4">
          {[
            {
              label: 'Vencidas',
              value: taskStats.overdue,
              color: 'text-destructive bg-destructive/10',
            },
            {
              label: 'Pendientes',
              value: taskStats.pending,
              color: 'text-status-pending bg-status-pending/10',
            },
            {
              label: 'Próximas',
              value: taskStats.upcoming,
              color: 'text-status-upcoming bg-status-upcoming/10',
            },
            {
              label: 'Completadas',
              value: taskStats.completed,
              color: 'text-status-completed bg-status-completed/10',
            },
          ].map((st) => (
            <div key={st.label} className={`report-item rounded-lg p-3 text-center ${st.color}`}>
              <p className="text-2xl font-bold">{st.value}</p>
              <p className="text-xs">{st.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. ESTADO POR SECTOR (peor primero) ── */}
      {sortedSectors.length > 0 && (
        <section className="report-section mb-10 print:break-before-page">
          <Title>Estado por Sector</Title>
          <p className="text-muted-foreground mb-4 text-sm">
            Ordenados del sector que más atención necesita al que mejor está.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
            {sortedSectors.map((s) => (
              <div key={s.sector} className="report-item border-border rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">
                    {PROPERTY_SECTOR_LABELS[s.sector as keyof typeof PROPERTY_SECTOR_LABELS] ??
                      s.sector}
                  </p>
                  <span className={`text-sm font-bold ${scoreColor(s.score)}`}>{s.score}%</span>
                </div>
                <Bar value={s.score} />
                <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                  <span>{s.total} tareas</span>
                  {s.overdue > 0 && (
                    <span className="text-destructive font-medium">{s.overdue} vencidas</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. HALLAZGOS POR CATEGORÍA (más vencidas primero) ── */}
      {sortedCats.length > 0 && (
        <section className="report-section mb-10 print:break-before-page">
          <Title>Hallazgos por Categoría</Title>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 text-left font-medium">Categoría</th>
                <th className="py-2 text-center font-medium">Total</th>
                <th className="py-2 text-center font-medium">Completadas</th>
                <th className="py-2 text-center font-medium">Vencidas</th>
                <th className="py-2 text-center font-medium">Condición</th>
              </tr>
            </thead>
            <tbody>
              {sortedCats.map((c) => (
                <tr key={c.categoryName} className="border-border border-b">
                  <td className="py-2 font-medium">{c.categoryName}</td>
                  <td className="py-2 text-center">{c.totalTasks}</td>
                  <td className="text-status-completed py-2 text-center">{c.completedTasks}</td>
                  <td
                    className={`py-2 text-center ${c.overdueTasks > 0 ? 'text-destructive font-medium' : ''}`}
                  >
                    {c.overdueTasks}
                  </td>
                  <td className={`py-2 text-center font-medium ${scoreColor(c.avgCondition * 20)}`}>
                    {c.avgCondition > 0 ? c.avgCondition.toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── 5. TAREAS QUE REQUIEREN ATENCIÓN (urgentes primero) ── */}
      {sortedOverdue.length > 0 && (
        <section className="report-section mb-10 print:break-before-page">
          <Title>Tareas que Requieren Atención</Title>
          <p className="text-muted-foreground mb-4 text-sm">
            Ordenadas por prioridad: las más urgentes primero.
          </p>
          <div className="space-y-2">
            {sortedOverdue.map((t) => (
              <div
                key={t.id}
                className="report-item border-destructive/20 bg-destructive/5 rounded-lg border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.category.name}
                      {t.sector && ` · ${PROPERTY_SECTOR_LABELS[t.sector] ?? t.sector}`}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-destructive font-medium">
                      {t.nextDueDate ? formatRelativeDate(new Date(t.nextDueDate)) : 'Sin fecha'}
                    </p>
                    <p className="text-muted-foreground">
                      {TASK_PRIORITY_LABELS[t.priority]}
                      {' · '}
                      {PROFESSIONAL_REQUIREMENT_LABELS[t.professionalRequirement]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. HISTORIAL DE INSPECCIONES (con fotos) ── */}
      {recentLogs.length > 0 && (
        <section className="report-section mb-10 print:break-before-page">
          <Title>Historial de Inspecciones Recientes</Title>
          <div className="space-y-3">
            {recentLogs.slice(0, 12).map((l) => (
              <div key={l.id} className="report-item border-border rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{l.task.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {l.task.category.name}
                      {l.task.sector &&
                        ` · ${PROPERTY_SECTOR_LABELS[l.task.sector] ?? l.task.sector}`}
                    </p>
                  </div>
                  <p className="text-muted-foreground shrink-0 text-xs">
                    {new Date(l.completedAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>
                    Resultado: <strong>{TASK_RESULT_LABELS[l.result] ?? l.result}</strong>
                  </span>
                  <span>
                    Condición:{' '}
                    <strong className={scoreColor(CONDITION_SCORE[l.conditionFound] ?? 50)}>
                      {CONDITION_FOUND_LABELS[l.conditionFound] ?? l.conditionFound}
                    </strong>
                  </span>
                  <span>Acción: {ACTION_TAKEN_LABELS[l.actionTaken] ?? l.actionTaken}</span>
                  {l.cost != null && <span>Costo: ${l.cost.toLocaleString('es-AR')}</span>}
                </div>
                {l.notes && <p className="text-muted-foreground mt-1 text-xs italic">{l.notes}</p>}
                {l.photoUrl && (
                  <img
                    src={l.photoUrl}
                    alt={`Foto: ${l.task.name}`}
                    className="mt-2 max-h-48 rounded-lg object-cover print:max-h-36"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 7. REGISTRO FOTOGRÁFICO (galería consolidada) ── */}
      {logsWithPhotos.length > 1 && (
        <section className="report-section mb-10 print:break-before-page">
          <Title>Registro Fotográfico</Title>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3">
            {logsWithPhotos.map((l) => (
              <div key={l.id} className="report-item">
                <img
                  src={l.photoUrl!}
                  alt={`Foto: ${l.task.name}`}
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                  loading="lazy"
                />
                <p className="mt-1 text-xs font-medium">{l.task.name}</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(l.completedAt).toLocaleDateString('es-AR')} ·{' '}
                  {CONDITION_FOUND_LABELS[l.conditionFound] ?? l.conditionFound}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 8. PLAN DE MANTENIMIENTO ── */}
      {upcomingTasks.length > 0 && (
        <section className="report-section mb-10 print:break-before-page">
          <Title>Plan de Mantenimiento — Próximas Tareas</Title>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 text-left font-medium">Tarea</th>
                <th className="py-2 text-left font-medium">Categoría</th>
                <th className="py-2 text-center font-medium">Fecha</th>
                <th className="py-2 text-center font-medium">Quién</th>
              </tr>
            </thead>
            <tbody>
              {upcomingTasks.map((t) => (
                <tr key={t.id} className="border-border border-b">
                  <td className="py-2 font-medium">{t.name}</td>
                  <td className="text-muted-foreground py-2">{t.category.name}</td>
                  <td className="py-2 text-center">
                    {t.nextDueDate ? new Date(t.nextDueDate).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="py-2 text-center text-xs">
                    {PROFESSIONAL_REQUIREMENT_LABELS[t.professionalRequirement]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── 9. FOOTER ── */}
      <section className="mb-10">
        <div className="border-border border-t pt-6 text-center">
          <p className="type-title-md font-heading text-primary">EPDE</p>
          <p className="text-muted-foreground text-sm">
            Estudio Profesional de Diagnóstico Edilicio
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            Informe generado el {new Date().toLocaleString('es-AR')}
          </p>
          <p className="text-muted-foreground mt-1 text-xs italic">
            Este informe refleja el estado de la vivienda al momento de su generación.
          </p>
        </div>
      </section>
    </div>
  );
}
