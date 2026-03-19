'use client';

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

import { Button } from '@/components/ui/button';
import { getPropertyReport } from '@/lib/api/properties';

// ─── Score helpers ────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  if (score >= 40) return 'text-caution';
  return 'text-destructive';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-warning';
  if (score >= 40) return 'bg-caution';
  return 'bg-destructive';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bueno';
  if (score >= 40) return 'Regular';
  if (score >= 20) return 'Necesita atención';
  return 'Crítico';
}

function statusMessage(score: number): string {
  if (score >= 80)
    return 'Tu vivienda está en excelente estado. El mantenimiento preventivo está funcionando correctamente.';
  if (score >= 60)
    return 'Tu vivienda está en buen estado general, pero hay aspectos que necesitan atención para evitar que se acumulen problemas.';
  if (score >= 40)
    return 'Tu vivienda necesita atención. Hay tareas pendientes que podrían generar reparaciones costosas si no se atienden pronto.';
  return 'Tu vivienda necesita atención urgente. Los problemas acumulados pueden derivar en reparaciones mayores. Te recomendamos actuar de inmediato.';
}

const DIMENSION_LABELS: Record<string, { label: string; hint: string }> = {
  compliance: { label: 'Cumplimiento', hint: 'Tareas completadas a tiempo' },
  condition: { label: 'Condición', hint: 'Estado general según inspecciones' },
  coverage: { label: 'Cobertura', hint: 'Sectores inspeccionados recientemente' },
  investment: { label: 'Inversión', hint: 'Proporción de acciones preventivas' },
  trend: { label: 'Tendencia', hint: 'Evolución reciente del estado' },
};

// ─── Components ───────────────────────────────────────────

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
      <div
        className={`h-full rounded-full transition-all ${className ?? scoreBg(value)}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="type-title-lg text-foreground font-heading mb-4 border-b pb-2">{children}</h2>
  );
}

function ReportSection({
  children,
  pageBreak = false,
}: {
  children: React.ReactNode;
  pageBreak?: boolean;
}) {
  return (
    <section className={`mb-8 ${pageBreak ? 'print:break-before-page' : ''}`}>{children}</section>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function PropertyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  useEffect(() => {
    document.title = 'Informe Técnico | EPDE';
  }, []);

  const {
    data: report,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [QUERY_KEYS.properties, id, 'report'],
    queryFn: ({ signal }) => getPropertyReport(id, signal).then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Cargando informe"
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
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">No se pudo generar el informe</p>
        <Button variant="outline" asChild>
          <Link href={`/properties/${id}`}>Volver a la propiedad</Link>
        </Button>
      </div>
    );
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
  const score = healthIndex.score;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Action bar — hidden in print */}
      <div className="no-print mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href={`/properties/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Volver a la propiedad
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
          Imprimir / Descargar PDF
        </Button>
      </div>

      {/* ── Section 1: Cover ── */}
      <ReportSection>
        <div className="mb-8 text-center">
          <p className="type-title-lg font-heading text-primary mb-1">EPDE</p>
          <h1 className="type-display-lg font-heading text-foreground mb-2">
            Informe Técnico de Diagnóstico Edilicio
          </h1>
          <p className="text-muted-foreground">
            {property.address}, {property.city}
          </p>
          <p className="text-muted-foreground text-sm">
            {PROPERTY_TYPE_LABELS[property.type as keyof typeof PROPERTY_TYPE_LABELS] ??
              property.type}
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

        {/* ISV Score big */}
        <div className="bg-card border-border mx-auto max-w-md rounded-2xl border p-6 text-center">
          <p className="text-muted-foreground mb-1 text-sm">Índice de Salud de la Vivienda</p>
          <p className={`text-5xl font-bold ${scoreColor(score)}`}>{score}</p>
          <p className={`text-lg font-medium ${scoreColor(score)}`}>{scoreLabel(score)}</p>
          <ProgressBar value={score} className={scoreBg(score)} />
        </div>
      </ReportSection>

      {/* ── Section 2: Executive Summary ── */}
      <ReportSection pageBreak>
        <SectionTitle>Resumen Ejecutivo</SectionTitle>

        <div className="bg-muted/40 mb-6 rounded-xl p-5">
          <p className="type-body-md text-foreground leading-relaxed">{statusMessage(score)}</p>
        </div>

        {/* 5 dimensions */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {(Object.entries(healthIndex.dimensions) as [string, number][]).map(([key, value]) => {
            const dim = DIMENSION_LABELS[key];
            if (!dim) return null;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium">{dim.label}</p>
                  <p className={`text-sm font-bold ${scoreColor(value)}`}>{value}/100</p>
                </div>
                <ProgressBar value={value} />
                <p className="text-muted-foreground text-xs">{dim.hint}</p>
              </div>
            );
          })}
        </div>

        {/* Task stats */}
        <div className="grid grid-cols-4 gap-3">
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
          ].map((stat) => (
            <div key={stat.label} className={`rounded-lg p-3 text-center ${stat.color}`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* ── Section 3: Sectors ── */}
      {sectorBreakdown.length > 0 && (
        <ReportSection pageBreak>
          <SectionTitle>Estado por Sector</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {sectorBreakdown.map((s) => {
              const sectorScore =
                s.total > 0 ? Math.round(((s.total - s.overdue) / s.total) * 100) : 100;
              return (
                <div key={s.sector} className="border-border rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">
                      {PROPERTY_SECTOR_LABELS[s.sector as keyof typeof PROPERTY_SECTOR_LABELS] ??
                        s.sector}
                    </p>
                    <span className={`text-sm font-bold ${scoreColor(sectorScore)}`}>
                      {sectorScore}%
                    </span>
                  </div>
                  <ProgressBar value={sectorScore} />
                  <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                    <span>{s.total} tareas</span>
                    {s.overdue > 0 && (
                      <span className="text-destructive">{s.overdue} vencidas</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ReportSection>
      )}

      {/* ── Section 4: Categories ── */}
      {categoryBreakdown.length > 0 && (
        <ReportSection pageBreak>
          <SectionTitle>Hallazgos por Categoría</SectionTitle>
          <div className="overflow-x-auto">
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
                {categoryBreakdown.map((cat) => (
                  <tr key={cat.categoryName} className="border-border border-b">
                    <td className="py-2 font-medium">{cat.categoryName}</td>
                    <td className="py-2 text-center">{cat.totalTasks}</td>
                    <td className="text-status-completed py-2 text-center">{cat.completedTasks}</td>
                    <td
                      className={`py-2 text-center ${cat.overdueTasks > 0 ? 'text-destructive font-medium' : ''}`}
                    >
                      {cat.overdueTasks}
                    </td>
                    <td
                      className={`py-2 text-center font-medium ${scoreColor(cat.avgCondition * 20)}`}
                    >
                      {cat.avgCondition > 0 ? cat.avgCondition.toFixed(1) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      {/* ── Section 5: Tasks Requiring Attention ── */}
      {overdueTasks.length > 0 && (
        <ReportSection pageBreak>
          <SectionTitle>Tareas que Requieren Atención</SectionTitle>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="border-destructive/20 bg-destructive/5 rounded-lg border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {task.category.name}
                      {task.sector &&
                        ` · ${PROPERTY_SECTOR_LABELS[task.sector as keyof typeof PROPERTY_SECTOR_LABELS] ?? task.sector}`}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-destructive font-medium">
                      {task.nextDueDate
                        ? formatRelativeDate(new Date(task.nextDueDate))
                        : 'Sin fecha'}
                    </p>
                    <p className="text-muted-foreground">
                      {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
                      {' · '}
                      {
                        PROFESSIONAL_REQUIREMENT_LABELS[
                          task.professionalRequirement as keyof typeof PROFESSIONAL_REQUIREMENT_LABELS
                        ]
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {/* ── Section 6: Recent Inspections ── */}
      {recentLogs.length > 0 && (
        <ReportSection pageBreak>
          <SectionTitle>Historial de Inspecciones Recientes</SectionTitle>
          <div className="space-y-3">
            {recentLogs.slice(0, 12).map((log) => (
              <div key={log.id} className="border-border rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{log.task.name}</p>
                    <p className="text-muted-foreground text-xs">{log.task.category.name}</p>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {new Date(log.completedAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>
                    Resultado:{' '}
                    <strong>
                      {TASK_RESULT_LABELS[log.result as keyof typeof TASK_RESULT_LABELS] ??
                        log.result}
                    </strong>
                  </span>
                  <span>
                    Condición:{' '}
                    <strong
                      className={scoreColor(
                        log.conditionFound === 'EXCELLENT'
                          ? 100
                          : log.conditionFound === 'GOOD'
                            ? 80
                            : log.conditionFound === 'FAIR'
                              ? 60
                              : log.conditionFound === 'POOR'
                                ? 40
                                : 20,
                      )}
                    >
                      {CONDITION_FOUND_LABELS[
                        log.conditionFound as keyof typeof CONDITION_FOUND_LABELS
                      ] ?? log.conditionFound}
                    </strong>
                  </span>
                  <span>
                    Acción:{' '}
                    {ACTION_TAKEN_LABELS[log.actionTaken as keyof typeof ACTION_TAKEN_LABELS] ??
                      log.actionTaken}
                  </span>
                  {log.cost != null && <span>Costo: ${log.cost.toLocaleString('es-AR')}</span>}
                </div>
                {log.notes && (
                  <p className="text-muted-foreground mt-1 text-xs italic">{log.notes}</p>
                )}
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {/* ── Section 7: Upcoming Plan ── */}
      {upcomingTasks.length > 0 && (
        <ReportSection pageBreak>
          <SectionTitle>Plan de Mantenimiento — Próximas Tareas</SectionTitle>
          <div className="overflow-x-auto">
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
                {upcomingTasks.map((task) => (
                  <tr key={task.id} className="border-border border-b">
                    <td className="py-2 font-medium">{task.name}</td>
                    <td className="text-muted-foreground py-2">{task.category.name}</td>
                    <td className="py-2 text-center">
                      {task.nextDueDate
                        ? new Date(task.nextDueDate).toLocaleDateString('es-AR')
                        : '—'}
                    </td>
                    <td className="py-2 text-center text-xs">
                      {
                        PROFESSIONAL_REQUIREMENT_LABELS[
                          task.professionalRequirement as keyof typeof PROFESSIONAL_REQUIREMENT_LABELS
                        ]
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      {/* ── Section 8: Footer ── */}
      <ReportSection>
        <div className="border-border border-t pt-6 text-center">
          <p className="type-title-md font-heading text-primary">EPDE</p>
          <p className="text-muted-foreground text-sm">
            Estudio Profesional de Diagnóstico Edilicio
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            Informe generado el {new Date().toLocaleString('es-AR')}
          </p>
          <p className="text-muted-foreground mt-1 text-xs italic">
            Este informe refleja el estado de la vivienda al momento de su generación. Los
            resultados pueden variar según las acciones de mantenimiento realizadas.
          </p>
        </div>
      </ReportSection>
    </div>
  );
}
