'use client';

import type { PropertyHealthIndex } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS, type PropertySector } from '@epde/shared';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DIMENSION_LABELS = {
  compliance: { name: 'Cumplimiento', hint: 'Tareas al día (ponderado por prioridad)' },
  condition: { name: 'Condición', hint: 'Estado encontrado en últimas inspecciones' },
  coverage: { name: 'Cobertura', hint: 'Sectores inspeccionados en últimos 12 meses' },
  investment: { name: 'Inversión', hint: 'Ratio preventivo vs correctivo' },
  trend: { name: 'Tendencia', hint: 'Comparación con trimestre anterior' },
} as const;

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-destructive';
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-destructive';
}

function TrendIcon({ value }: { value: number }) {
  if (value > 55) return <ArrowUp className="text-success h-4 w-4" />;
  if (value < 45) return <ArrowDown className="text-destructive h-4 w-4" />;
  return <ArrowRight className="text-muted-foreground h-4 w-4" />;
}

interface HealthIndexCardProps {
  index: PropertyHealthIndex;
}

export function HealthIndexCard({ index }: HealthIndexCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="type-title-md">Índice de Salud de la Vivienda</CardTitle>
          <div className="flex items-center gap-2">
            <span className={`type-number-md ${scoreColor(index.score)}`}>{index.score}</span>
            <span className="type-body-sm text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              index.score >= 60
                ? 'bg-success/15 text-success'
                : index.score >= 40
                  ? 'bg-amber-500/15 text-amber-600'
                  : 'bg-destructive/15 text-destructive'
            }`}
          >
            {index.label}
          </span>
          <TrendIcon value={index.dimensions.trend} />
          <span className="text-muted-foreground text-xs">
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
                  <span className="text-sm font-medium">{name}</span>
                  <span className={`text-sm font-medium tabular-nums ${scoreColor(value)}`}>
                    {value}
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${barColor(value)}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
              </div>
            );
          })}
        </div>

        {/* Sector scores */}
        {index.sectorScores.length > 0 && (
          <div className="border-border border-t pt-3">
            <p className="text-foreground mb-2 text-sm font-semibold">Salud por sector</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {index.sectorScores.map((s) => {
                const label = PROPERTY_SECTOR_LABELS[s.sector as PropertySector] ?? s.sector;
                return (
                  <Link
                    key={s.sector}
                    href={`/tasks?sector=${s.sector}`}
                    className="hover:bg-muted/50 flex items-center justify-between rounded px-2 py-1 transition-colors"
                  >
                    <span className="text-xs">{label}</span>
                    <span className={`text-xs font-medium tabular-nums ${scoreColor(s.score)}`}>
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
      </CardContent>
    </Card>
  );
}
