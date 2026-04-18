'use client';

import type { ProfessionalSpecialty } from '@epde/shared';
import { PROFESSIONAL_SPECIALTY_LABELS, PROFESSIONAL_SPECIALTY_VALUES } from '@epde/shared';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { useProfessionals } from '@/hooks/use-professionals';

/**
 * Tier 1 = crítico (plomero + electricista): sin estos no podemos operar.
 * Tier 2 = alta prioridad (arquitecto, techista): cubren las tareas obligatorias restantes.
 * Tier 3 = media (HVAC, fumigador, seguridad, docs): cubren las obligatorias específicas.
 * Tier 4 = complementarios (resto): tareas recomendadas + premium.
 *
 * Deriva del audit de 2026-04-18 sobre TaskTemplates con professionalRequirement.
 * Ver docs/adr/018 para el rationale.
 */
const SPECIALTY_TIERS: Record<ProfessionalSpecialty, { tier: 1 | 2 | 3 | 4; priority: string }> = {
  // Tier 1 — críticos (sin estos no podemos cumplir tareas obligatorias)
  PLUMBER: { tier: 1, priority: 'Crítico — agua, cloacas, sanitarios' },
  GASFITTER: { tier: 1, priority: 'Crítico — gas natural/GLP, NAG-226 (ENARGAS)' },
  ELECTRICIAN: { tier: 1, priority: 'Crítico — 11 tareas, 8 obligatorias' },
  // Tier 2 — alta prioridad
  ARCHITECT_ENGINEER: { tier: 2, priority: 'Alto — estructura, planos, habilitación municipal' },
  MASON: { tier: 2, priority: 'Alto — revoques, contrapisos, mampostería' },
  ROOFER_WATERPROOFER: { tier: 2, priority: 'Alto — 6 tareas, 2 obligatorias' },
  // Tier 3 — prioridad media
  HVAC_TECHNICIAN: { tier: 3, priority: 'Medio — 3 tareas, 2 obligatorias' },
  PEST_CONTROL: { tier: 3, priority: 'Medio — 4 tareas, 3 obligatorias' },
  EXTINGUISHER_SERVICE: { tier: 3, priority: 'Medio — matafuegos obligatorios' },
  DRAIN_CLEANER: { tier: 3, priority: 'Medio — urgencias cloacales, cámaras sépticas' },
  // Tier 4 — complementarios
  PAINTER: { tier: 4, priority: 'Complementario — 3 tareas, 1 obligatoria' },
  CARPENTER: { tier: 4, priority: 'Complementario — 4 tareas recomendadas' },
  LANDSCAPER: { tier: 4, priority: 'Complementario — 3 tareas recomendadas' },
  SOLAR_SPECIALIST: { tier: 4, priority: 'Complementario — 2 tareas' },
  WATER_TECHNICIAN: { tier: 4, priority: 'Complementario — pozos, agua no de red' },
  LOCKSMITH: { tier: 4, priority: 'Complementario — cerraduras, emergencias' },
  GLAZIER: { tier: 4, priority: 'Complementario — vidrios, aluminio, aberturas' },
  IRONWORKER: { tier: 4, priority: 'Complementario — rejas, portones, soldadura' },
  DRYWALL_INSTALLER: { tier: 4, priority: 'Complementario — durlock, cielorrasos' },
};

const TIER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Críticos',
  2: 'Alta prioridad',
  3: 'Prioridad media',
  4: 'Complementarios',
};

/**
 * Cobertura global (no respeta filtros del listado). Hace su propio fetch sin
 * filtros y con take alto para escanear todo el catálogo.
 */
export function CoverageCard() {
  const { data, isLoading } = useProfessionals({ take: 100 });
  const allProfessionals = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const { missingByTier, criticalMissing, totalCovered, percentage } = useMemo(() => {
    const covered = new Set<ProfessionalSpecialty>();
    for (const p of allProfessionals) {
      if (p.tier === 'BLOCKED') continue;
      for (const s of p.specialties) {
        covered.add(s.specialty);
      }
    }

    const missingByTier: Record<1 | 2 | 3 | 4, ProfessionalSpecialty[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
    };

    for (const specialty of PROFESSIONAL_SPECIALTY_VALUES) {
      const info = SPECIALTY_TIERS[specialty];
      if (!covered.has(specialty)) missingByTier[info.tier].push(specialty);
    }

    return {
      missingByTier,
      criticalMissing: missingByTier[1],
      totalCovered: covered.size,
      percentage: Math.round((covered.size / PROFESSIONAL_SPECIALTY_VALUES.length) * 100),
    };
  }, [allProfessionals]);

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4 sm:p-5">
          <SkeletonShimmer className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isComplete = totalCovered === PROFESSIONAL_SPECIALTY_VALUES.length;
  const hasCriticalGap = criticalMissing.length > 0;

  const barColor = hasCriticalGap
    ? 'bg-destructive'
    : percentage < 60
      ? 'bg-warning'
      : percentage < 100
        ? 'bg-primary'
        : 'bg-success';

  return (
    <Card className="mb-4">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isComplete ? (
                <CheckCircle2 className="text-success h-5 w-5" />
              ) : hasCriticalGap ? (
                <AlertTriangle className="text-destructive h-5 w-5" />
              ) : (
                <ShieldCheck className="text-primary h-5 w-5" />
              )}
              <h3 className="type-title-md font-medium">Cobertura de especialidades</h3>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {isComplete
                ? 'Tenés al menos un profesional activo en todas las especialidades.'
                : hasCriticalGap
                  ? 'Faltan profesionales críticos. Sin estos no podés cumplir tareas obligatorias.'
                  : `Cubriste ${totalCovered} de ${PROFESSIONAL_SPECIALTY_VALUES.length} especialidades.`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-foreground text-2xl font-bold">
              {totalCovered}
              <span className="text-muted-foreground text-sm font-normal">
                /{PROFESSIONAL_SPECIALTY_VALUES.length}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">{percentage}%</p>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Porcentaje de especialidades cubiertas"
          className="bg-muted mb-4 h-2 w-full overflow-hidden rounded-full"
        >
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {!isComplete && (
          <div className="space-y-2">
            {([1, 2, 3, 4] as const).map((tier) => {
              const missing = missingByTier[tier];
              if (missing.length === 0) return null;
              const dotColor =
                tier === 1
                  ? 'bg-destructive'
                  : tier === 2
                    ? 'bg-warning'
                    : tier === 3
                      ? 'bg-caution'
                      : 'bg-muted-foreground/40';
              return (
                <div key={tier} className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">
                      {TIER_LABELS[tier]} — faltan {missing.length}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {missing.map((s) => PROFESSIONAL_SPECIALTY_LABELS[s]).join(', ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isComplete && (
          <p className="text-muted-foreground mt-3 text-xs italic">
            Solo se cuentan profesionales activos. Tier BLOCKED no cubre su especialidad.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
