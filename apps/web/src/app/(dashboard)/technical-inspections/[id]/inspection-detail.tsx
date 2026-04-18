'use client';

import {
  formatARSCompact,
  formatRelativeDate,
  INSPECTION_PRICE_TIER_LABELS,
  TECHNICAL_INSPECTION_ACTIVITIES,
  TECHNICAL_INSPECTION_DESCRIPTIONS,
  TECHNICAL_INSPECTION_ESTIMATED_DAYS,
  TECHNICAL_INSPECTION_LABELS,
  TECHNICAL_INSPECTION_STATUS_ENUM_LABELS,
  TECHNICAL_INSPECTION_TOOLS,
} from '@epde/shared';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  ClipboardList,
  FileText,
  User,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTechnicalInspection } from '@/hooks/use-technical-inspections';
import { ROUTES } from '@/lib/routes';

import { AdminActionsCard } from './admin-actions-card';
import { ClientPayCard } from './client-pay-card';

interface Props {
  id: string;
  isAdmin: boolean;
  isClient: boolean;
}

export function InspectionDetail({ id, isAdmin, isClient }: Props) {
  const { data, isLoading, isError, refetch } = useTechnicalInspection(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-card h-24 animate-pulse rounded-lg border" />
        <div className="bg-card h-48 animate-pulse rounded-lg border" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        message="No se pudo cargar la inspección"
        onRetry={refetch}
        className="justify-center py-24"
      />
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href={ROUTES.technicalInspections}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <PageHeader
        title={`${data.inspectionNumber} · ${TECHNICAL_INSPECTION_LABELS[data.type]}`}
        description={TECHNICAL_INSPECTION_DESCRIPTIONS[data.type]}
        action={
          <Badge variant={data.status === 'CANCELED' ? 'destructive' : 'default'}>
            {TECHNICAL_INSPECTION_STATUS_ENUM_LABELS[data.status] ?? data.status}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Building2 className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                {data.property?.address}, {data.property?.city}
              </p>
              {data.propertyId && (
                <Link
                  href={ROUTES.property(data.propertyId)}
                  className="text-primary text-xs hover:underline"
                >
                  Ver propiedad
                </Link>
              )}
            </div>
          </div>

          {isAdmin && data.requester && (
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground h-4 w-4" />
              <span>
                {data.requester.name} ·{' '}
                <span className="text-muted-foreground">{data.requester.email}</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span>
              Solicitada {formatRelativeDate(new Date(data.createdAt))}
              {data.scheduledFor && (
                <> · Agendada {formatRelativeDate(new Date(data.scheduledFor))}</>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Entrega estimada:</span>{' '}
            <span>{TECHNICAL_INSPECTION_ESTIMATED_DAYS[data.type]}</span>
          </div>

          <div className="border-t pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-xs">Honorarios</span>
              <span className="text-base font-bold tabular-nums">
                {formatARSCompact(data.feeAmount)}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Tier {INSPECTION_PRICE_TIER_LABELS[data.priceTier]}
              {data.propertySqm ? ` · ${data.propertySqm} m²` : ' (sin m² registrados)'}
            </p>
            {data.hadActivePlan && (
              <p className="text-muted-foreground text-xs">Incluye 15% de descuento cliente EPDE</p>
            )}
            {data.paidAt && (
              <p className="mt-1 flex items-center gap-1 text-xs text-green-700 dark:text-green-500">
                <Check className="h-3 w-3" /> Pagada {formatRelativeDate(new Date(data.paidAt))}
                {data.paymentMethod && ` · ${data.paymentMethod}`}
              </p>
            )}
          </div>

          {data.clientNotes && (
            <div className="border-t pt-3">
              <p className="text-muted-foreground text-xs font-medium">Notas del cliente</p>
              <p className="mt-1 whitespace-pre-wrap">{data.clientNotes}</p>
            </div>
          )}

          {isAdmin && data.adminNotes && (
            <div className="border-t pt-3">
              <p className="text-muted-foreground text-xs font-medium">Notas internas</p>
              <p className="mt-1 whitespace-pre-wrap">{data.adminNotes}</p>
            </div>
          )}

          {data.deliverableUrl && (
            <div className="border-t pt-3">
              <p className="text-muted-foreground text-xs font-medium">Informe firmado</p>
              <a
                href={data.deliverableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary mt-1 inline-flex items-center gap-1.5 text-sm hover:underline"
              >
                <FileText className="h-4 w-4" />
                {data.deliverableFileName ?? 'Descargar informe'}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="text-primary h-4 w-4" />
            Alcance de la inspección
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-xs">
            {isAdmin
              ? 'Checklist operativo de referencia para la visita. Adaptar según lo observado en sitio.'
              : 'Este es el alcance que relevará la arquitecta el día de la visita.'}
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {TECHNICAL_INSPECTION_ACTIVITIES[data.type].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="text-primary h-4 w-4" />
              Equipamiento a llevar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-xs">
              Inventario mínimo. Confirmar estado y batería antes de salir.
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              {TECHNICAL_INSPECTION_TOOLS[data.type].map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isAdmin && <AdminActionsCard inspection={data} />}
      {isClient && <ClientPayCard inspection={data} />}
    </div>
  );
}
