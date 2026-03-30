import type { ConditionFound, TaskPriority } from '@epde/shared';
import React from 'react';

// ─── Priority / condition constants ──────────────────────

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const CONDITION_SCORE: Record<ConditionFound, number> = {
  EXCELLENT: 100,
  GOOD: 80,
  FAIR: 60,
  POOR: 40,
  CRITICAL: 20,
};

// ─── Score helpers ───────────────────────────────────────

export function scoreColor(s: number) {
  if (s >= 80) return 'text-success';
  if (s >= 60) return 'text-warning';
  if (s >= 40) return 'text-caution';
  return 'text-destructive';
}

export function scoreBg(s: number) {
  if (s >= 80) return 'bg-success';
  if (s >= 60) return 'bg-warning';
  if (s >= 40) return 'bg-caution';
  return 'bg-destructive';
}

export function scoreLabel(s: number) {
  if (s >= 80) return 'Excelente';
  if (s >= 60) return 'Bueno';
  if (s >= 40) return 'Regular';
  if (s >= 20) return 'Necesita atención';
  return 'Crítico';
}

export function statusMessage(s: number) {
  if (s >= 80)
    return 'Tu vivienda está en excelente estado. El mantenimiento preventivo está funcionando correctamente.';
  if (s >= 60)
    return 'Tu vivienda está en buen estado general, pero hay aspectos que necesitan atención para evitar que se acumulen problemas.';
  if (s >= 40)
    return 'Tu vivienda necesita atención. Hay tareas pendientes que podrían generar reparaciones costosas si no se atienden pronto.';
  return 'Tu vivienda necesita atención urgente. Los problemas acumulados pueden derivar en reparaciones mayores. Te recomendamos actuar de inmediato.';
}

export const DIM: Record<string, { label: string; hint: string }> = {
  compliance: { label: 'Cumplimiento', hint: 'Tareas completadas a tiempo' },
  condition: { label: 'Condición', hint: 'Estado general según inspecciones' },
  coverage: { label: 'Cobertura', hint: 'Sectores inspeccionados recientemente' },
  investment: { label: 'Inversión', hint: 'Proporción de acciones preventivas' },
  trend: { label: 'Tendencia', hint: 'Evolución reciente del estado' },
};

// ─── Small reusable components ───────────────────────────

export const Bar = React.memo(function Bar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="bg-muted print:border-border h-3 w-full overflow-hidden rounded-full print:border">
      <div
        className={`h-full rounded-full ${className ?? scoreBg(value)}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
});

export const Title = React.memo(function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="type-title-lg text-foreground font-heading mb-4 border-b pb-2">{children}</h2>
  );
});
