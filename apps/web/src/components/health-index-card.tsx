'use client';

import type { ISVSnapshotPublic, PropertyHealthIndex } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS, type PropertySector } from '@epde/shared';
import { ArrowDown, ArrowRight, ArrowUp, Printer } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DIMENSION_LABELS = {
  compliance: {
    name: '¿Estás al día?',
    hint: 'Cuántas tareas completaste a tiempo (las urgentes cuentan más)',
  },
  condition: {
    name: '¿En qué estado está?',
    hint: 'El estado que reportaste en las últimas inspecciones',
  },
  coverage: {
    name: '¿Cuánto revisamos?',
    hint: 'Cuántos sectores de tu casa fueron revisados en el último año',
  },
  investment: {
    name: '¿Prevenís o reparás?',
    hint: 'Si gastás más en prevención o en reparaciones de emergencia',
  },
  trend: {
    name: '¿Mejora o empeora?',
    hint: 'Si tu puntaje mejoró o empeoró en los últimos 3 meses',
  },
} as const;

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  if (score >= 40) return 'text-caution';
  return 'text-destructive';
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-warning';
  if (score >= 40) return 'bg-caution';
  return 'bg-destructive';
}

function TrendIcon({ value }: { value: number }) {
  if (value > 55) return <ArrowUp className="text-success h-4 w-4" />;
  if (value < 45) return <ArrowDown className="text-destructive h-4 w-4" />;
  return <ArrowRight className="text-muted-foreground h-4 w-4" />;
}

interface HealthIndexCardProps {
  index: PropertyHealthIndex;
  history?: ISVSnapshotPublic[];
  address?: string;
}

export function HealthIndexCard({ index, history, address }: HealthIndexCardProps) {
  return (
    <Card data-print-target>
      {/* Print-only header */}
      <div className="hidden print:mb-4 print:block print:border-b print:px-6 print:pt-6 print:pb-4">
        <p className="text-lg font-bold">EPDE — Estudio Profesional de Diagnóstico Edilicio</p>
        {address && <p className="text-muted-foreground text-sm">{address}</p>}
        <p className="text-muted-foreground type-body-sm">
          Reporte generado el {new Date().toLocaleDateString('es-AR')}
        </p>
      </div>

      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle data-tour="property-health" className="type-title-md">
            Índice de Salud de la Vivienda
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="no-print hidden sm:inline-flex"
              onClick={() => window.print()}
            >
              <Printer className="mr-1.5 h-4 w-4" />
              Imprimir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="no-print sm:hidden"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
            </Button>
            <span className={`type-number-md ${scoreColor(index.score)}`}>{index.score}</span>
            <span className="type-body-sm text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`type-body-sm rounded-full px-2 py-0.5 font-medium ${
              index.score >= 60
                ? 'bg-success/15 text-success'
                : index.score >= 40
                  ? 'bg-caution/15 text-caution'
                  : 'bg-destructive/15 text-destructive'
            }`}
          >
            {index.label}
          </span>
          <TrendIcon value={index.dimensions.trend} />
          <span className="text-muted-foreground type-body-sm">
            {index.dimensions.trend > 55
              ? 'Mejorando'
              : index.dimensions.trend < 45
                ? 'Declinando'
                : 'Estable'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 5 Dimensions */}
        <div className="space-y-2.5">
          {(Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]).map((key) => {
            const value = index.dimensions[key];
            const { name, hint } = DIMENSION_LABELS[key];
            return (
              <div key={key}>
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="type-label-lg">{name}</span>
                  <span className={`type-label-lg tabular-nums ${scoreColor(value)}`}>{value}</span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${barColor(value)}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <p className="text-muted-foreground type-body-sm mt-0.5">{hint}</p>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {(() => {
          const recs: string[] = [];
          if (index.dimensions.compliance < 60)
            recs.push(
              'Completá las tareas vencidas de alta prioridad para mejorar tu cumplimiento.',
            );
          if (index.dimensions.condition < 50)
            recs.push(
              'Las últimas inspecciones muestran condiciones desfavorables. Revisá los sectores más afectados.',
            );
          if (index.dimensions.coverage < 50)
            recs.push(
              'Hay sectores sin inspección reciente. Programá revisiones para cubrir toda la vivienda.',
            );
          if (index.dimensions.investment < 40)
            recs.push(
              'La mayoría de las acciones son correctivas. Priorizá las inspecciones preventivas sobre las reparaciones.',
            );
          if (index.dimensions.trend < 45)
            recs.push(
              'La tendencia indica deterioro. Priorizá las tareas vencidas para revertir el declive.',
            );
          return recs.length > 0 ? (
            <div className="border-warning/20 bg-warning/10 rounded-lg border p-3">
              <p className="text-warning type-body-sm mb-1.5 font-semibold">Recomendaciones</p>
              <ul className="text-warning type-body-sm space-y-1">
                {recs.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-success/10 border-success/20 rounded-lg border p-3">
              <p className="text-success type-body-sm font-semibold">
                ¡Tu vivienda está en excelente estado! Seguí manteniendo el ritmo de inspecciones.
              </p>
            </div>
          );
        })()}

        {/* Sector scores */}
        {index.sectorScores.length > 0 && (
          <div className="border-border border-t pt-3">
            {/* Highlight worst sector */}
            {index.sectorScores[0] && index.sectorScores[0].score < 70 && (
              <div className="bg-destructive/5 border-destructive/20 mb-2 rounded-lg border p-2">
                <p className="type-body-sm text-destructive">
                  {PROPERTY_SECTOR_LABELS[index.sectorScores[0].sector as PropertySector] ??
                    index.sectorScores[0].sector}{' '}
                  necesita atención prioritaria (score: {index.sectorScores[0].score}%)
                </p>
              </div>
            )}
            <p className="type-title-sm text-foreground mb-2">Salud por sector</p>
            <div className="grid gap-1.5 sm:grid-cols-2 print:break-inside-avoid">
              {index.sectorScores.map((s) => {
                const label = PROPERTY_SECTOR_LABELS[s.sector as PropertySector] ?? s.sector;
                return (
                  <Link
                    key={s.sector}
                    href={`/tasks?sector=${s.sector}`}
                    className="hover:bg-muted/50 flex items-center justify-between rounded px-2 py-1 transition-colors"
                  >
                    <span className="type-body-sm">{label}</span>
                    <span
                      className={`type-body-sm font-medium tabular-nums ${scoreColor(s.score)}`}
                    >
                      {s.score}%
                      {s.overdue > 0 && (
                        <span className="text-destructive ml-1">
                          ({s.overdue} vencida{s.overdue !== 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* History chart */}
        {history && history.length > 1 && (
          <div className="border-border border-t pt-3">
            <p className="type-title-sm text-foreground mb-2">Evolución del ISV</p>
            <div className="flex items-end gap-1" style={{ height: 80 }}>
              {history.map((s) => {
                const h = Math.max(4, (s.score / 100) * 72);
                return (
                  <div key={s.month} className="group relative flex flex-1 flex-col items-center">
                    <div
                      className={`w-full rounded-t ${barColor(s.score)}`}
                      style={{ height: h }}
                    />
                    <span className="text-muted-foreground type-label-sm mt-1">
                      {s.month.slice(5)}
                    </span>
                    <div className="type-label-sm pointer-events-none absolute -top-6 hidden rounded bg-black/80 px-1.5 py-0.5 text-white group-hover:block">
                      {s.score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* ISV disclaimer */}
        <p className="text-muted-foreground/60 border-border type-body-sm border-t pt-3">
          El ISV es un indicador orientativo basado en inspecciones realizadas. No constituye una
          certificación técnica ni garantiza el estado estructural de la propiedad.
        </p>
      </CardContent>
    </Card>
  );
}
