'use client';

import type {
  CertificatesSummary,
  InactiveClientsSummary,
  ProfessionalsSummary,
} from '@epde/shared';
import { formatARSCompact } from '@epde/shared';
import { AlertCircle, Award, FileCheck, HardHat, UserX, Wallet } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/lib/routes';

interface Props {
  certificates: CertificatesSummary;
  professionals: ProfessionalsSummary;
  inactiveClients: InactiveClientsSummary;
}

/**
 * Panel unificado de métricas operativas auxiliares:
 * - Certificados (emitidos + elegibles sin emitir)
 * - Profesionales (red activa + matrículas + pagos pendientes)
 * - Clientes inactivos (riesgo de churn)
 *
 * Cada bloque es una sub-card con link directo a la acción concreta.
 */
export function OperationalExtrasCard({ certificates, professionals, inactiveClients }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Operación & retención</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Certificates */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Award className="text-primary h-4 w-4" />
              <p className="text-foreground text-sm font-medium">Certificados</p>
            </div>
            <p className="text-foreground text-2xl font-bold tabular-nums">
              {certificates.totalIssued}
            </p>
            <p className="text-muted-foreground text-xs">emitidos total</p>
            {certificates.eligibleNotIssued > 0 && (
              <div className="bg-success/5 border-success/30 mt-2 flex items-start gap-1.5 rounded-md border p-2">
                <FileCheck className="text-success mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p className="text-foreground text-xs leading-snug">
                  <strong>{certificates.eligibleNotIssued}</strong> elegibles sin emitir
                </p>
              </div>
            )}
          </div>

          {/* Professionals */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <HardHat className="text-primary h-4 w-4" />
              <Link
                href={ROUTES.professionals}
                className="text-foreground hover:text-primary text-sm font-medium transition-colors"
              >
                Profesionales
              </Link>
            </div>
            <p className="text-foreground text-2xl font-bold tabular-nums">
              {professionals.totalActive}
            </p>
            <p className="text-muted-foreground text-xs">
              activos · {professionals.blocked} bloqueados
            </p>
            {professionals.matriculasExpiringSoon > 0 && (
              <div className="bg-warning/5 border-warning/30 mt-2 flex items-start gap-1.5 rounded-md border p-2">
                <AlertCircle className="text-warning mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p className="text-foreground text-xs leading-snug">
                  <strong>{professionals.matriculasExpiringSoon}</strong> matrículas por vencer
                  (≤30d)
                </p>
              </div>
            )}
            {professionals.pendingPaymentsCount > 0 && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md border p-2">
                <Wallet className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p className="text-foreground text-xs leading-snug">
                  {professionals.pendingPaymentsCount} pagos pendientes —{' '}
                  <strong>{formatARSCompact(professionals.pendingPaymentsAmount)}</strong>
                </p>
              </div>
            )}
            {professionals.topPerformers.length > 0 && (
              <div className="mt-3 border-t pt-2">
                <p className="text-muted-foreground mb-1 text-[10px] tracking-widest uppercase">
                  Top trimestre
                </p>
                {professionals.topPerformers.map((p) => (
                  <Link
                    key={p.id}
                    href={ROUTES.professional(p.id)}
                    className="hover:text-primary flex items-center justify-between text-xs"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {p.assignmentsCount} · {p.rating > 0 ? `${p.rating}★` : '—'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Inactive clients */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <UserX className="text-primary h-4 w-4" />
              <Link
                href={ROUTES.clients}
                className="text-foreground hover:text-primary text-sm font-medium transition-colors"
              >
                Clientes en riesgo
              </Link>
            </div>
            <p className="text-foreground text-2xl font-bold tabular-nums">
              {inactiveClients.noActivityLast60Days}
            </p>
            <p className="text-muted-foreground text-xs">sin actividad +60 días</p>
            {inactiveClients.highOverdueRatio.length > 0 && (
              <div className="mt-3 border-t pt-2">
                <p className="text-muted-foreground mb-1 text-[10px] tracking-widest uppercase">
                  Tareas vencidas &gt;40%
                </p>
                {inactiveClients.highOverdueRatio.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    href={ROUTES.client(c.id)}
                    className="hover:text-primary flex items-center justify-between text-xs"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-destructive tabular-nums">
                      {(c.overdueRatio * 100).toFixed(0)}%
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
