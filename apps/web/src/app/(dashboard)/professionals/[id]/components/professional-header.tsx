'use client';

import type {
  ProfessionalAttachmentPublic,
  ProfessionalDetailPublic,
  ProfessionalTier,
} from '@epde/shared';
import {
  PROFESSIONAL_AVAILABILITY_LABELS,
  PROFESSIONAL_SPECIALTY_LABELS,
  PROFESSIONAL_TIER_LABELS,
} from '@epde/shared';
import { AlertTriangle, ArrowLeft, Phone, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

const TIER_VARIANT: Record<ProfessionalTier, 'success' | 'secondary' | 'warning' | 'destructive'> =
  {
    A: 'success',
    B: 'secondary',
    C: 'warning',
    BLOCKED: 'destructive',
  };

/** Returns highest-severity attachment warning (expired > expiring < 30 days). */
function getMatriculaWarning(
  attachments: ProfessionalAttachmentPublic[],
): { level: 'expired' | 'expiring'; days: number; type: string } | null {
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  let worst: { level: 'expired' | 'expiring'; days: number; type: string } | null = null;

  for (const a of attachments) {
    if (!a.expiresAt) continue;
    if (a.type !== 'MATRICULA' && a.type !== 'SEGURO_RC') continue;
    const days = Math.ceil((new Date(a.expiresAt).getTime() - now) / dayMs);
    const typeLabel = a.type === 'MATRICULA' ? 'Matrícula' : 'Seguro RC';
    if (days <= 0) return { level: 'expired', days, type: typeLabel };
    if (days <= 30 && (worst === null || days < worst.days)) {
      worst = { level: 'expiring', days, type: typeLabel };
    }
  }
  return worst;
}

export function ProfessionalHeader({
  professional,
  onOpenTierDialog,
  onOpenAvailabilityDialog,
  onOpenEditDialog,
}: {
  professional: ProfessionalDetailPublic;
  onOpenTierDialog: () => void;
  onOpenAvailabilityDialog: () => void;
  onOpenEditDialog: () => void;
}) {
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);
  const primary = professional.specialties.find((s) => s.isPrimary) ?? professional.specialties[0];
  const warning = getMatriculaWarning(professional.attachments);

  const copy = (value: string, kind: 'email' | 'phone') => {
    navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      <Link
        href={ROUTES.professionals}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Profesionales
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="type-display-sm text-foreground tracking-tight">{professional.name}</h1>
            <Badge variant={TIER_VARIANT[professional.tier] ?? 'secondary'}>
              Tier {professional.tier === 'BLOCKED' ? 'Bloqueado' : professional.tier}
            </Badge>
            <Badge variant="secondary">
              {PROFESSIONAL_AVAILABILITY_LABELS[professional.availability]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {primary && PROFESSIONAL_SPECIALTY_LABELS[primary.specialty]}
            {' · '}
            Matrícula {professional.registrationBody} {professional.registrationNumber}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => copy(professional.email, 'email')}
              className="border-border hover:bg-muted/40 inline-flex items-center gap-1 rounded-md border px-2 py-1 transition"
            >
              {copied === 'email' ? '✓ copiado' : professional.email}
            </button>
            <button
              type="button"
              onClick={() => copy(professional.phone, 'phone')}
              className="border-border hover:bg-muted/40 inline-flex items-center gap-1 rounded-md border px-2 py-1 transition"
            >
              <Phone className="h-3 w-3" />
              {copied === 'phone' ? '✓ copiado' : professional.phone}
            </button>
            <a
              href={`https://wa.me/${professional.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:bg-muted/40 inline-flex items-center gap-1 rounded-md border px-2 py-1 transition"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onOpenAvailabilityDialog}>
            Disponibilidad
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenTierDialog}>
            Tier
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenEditDialog}>
            Editar
          </Button>
        </div>
      </div>

      {warning && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-3 ${
            warning.level === 'expired'
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-warning/30 bg-warning/5'
          }`}
        >
          {warning.level === 'expired' ? (
            <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <Shield className="text-warning mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">
              {warning.level === 'expired'
                ? `${warning.type} vencida`
                : `${warning.type} vence en ${warning.days} día${warning.days === 1 ? '' : 's'}`}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {warning.level === 'expired'
                ? 'No asignes nuevos trabajos hasta que el profesional renueve la documentación.'
                : 'Pedile la renovación para evitar bloquear asignaciones.'}
            </p>
          </div>
        </div>
      )}

      {professional.tier === 'BLOCKED' && professional.blockedReason && (
        <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-3 text-sm">
          <p className="font-medium">🚨 {PROFESSIONAL_TIER_LABELS.BLOCKED} — no usar</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{professional.blockedReason}</p>
        </div>
      )}
    </div>
  );
}
