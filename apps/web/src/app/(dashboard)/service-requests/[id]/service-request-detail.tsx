'use client';

import type { ServiceRequestPublic } from '@epde/shared';
import {
  formatRelativeDate,
  SERVICE_STATUS_HINTS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_VARIANT,
  SERVICE_URGENCY_LABELS,
  ServiceStatus,
  URGENCY_VARIANT,
} from '@epde/shared';
import {
  AlertTriangle,
  AlignLeft,
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Home,
  Pencil,
  User,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { VisuallyHidden } from 'radix-ui';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState } from '@/components/error-state';
import { ServiceDetailTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { StatusFlow } from '@/components/status-flow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useServiceRequest, useUpdateServiceStatus } from '@/hooks/use-service-requests';

import { CreateBudgetDialog } from '../../budgets/create-budget-dialog';
import { EditServiceRequestDialog } from './edit-service-request-dialog';
import { ServiceRequestAttachments } from './service-request-attachments';
import { ServiceRequestComments } from './service-request-comments';
import { ServiceRequestTimeline } from './service-request-timeline';

const STATUS_TRANSITIONS: Partial<Record<ServiceStatus, ServiceStatus>> = {
  [ServiceStatus.OPEN]: ServiceStatus.IN_REVIEW,
  [ServiceStatus.IN_REVIEW]: ServiceStatus.IN_PROGRESS,
  [ServiceStatus.IN_PROGRESS]: ServiceStatus.RESOLVED,
  [ServiceStatus.RESOLVED]: ServiceStatus.CLOSED,
};

const TRANSITION_LABELS: Partial<Record<ServiceStatus, string>> = {
  [ServiceStatus.IN_REVIEW]: 'Pasar a En Revisión',
  [ServiceStatus.IN_PROGRESS]: 'Pasar a En Progreso',
  [ServiceStatus.RESOLVED]: 'Marcar como Resuelto',
  [ServiceStatus.CLOSED]: 'Cerrar solicitud',
};

interface ServiceRequestDetailProps {
  id: string;
  isAdmin: boolean;
  isClient: boolean;
  initialData?: ServiceRequestPublic;
}

export function ServiceRequestDetail({
  id,
  isAdmin,
  isClient,
  initialData,
}: ServiceRequestDetailProps) {
  const { data, isLoading, isError, refetch } = useServiceRequest(id, { initialData });
  const updateStatus = useUpdateServiceStatus();

  const [statusConfirm, setStatusConfirm] = useState<ServiceStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);

  const request = data;

  if (isError && !request)
    return (
      <ErrorState message="No se pudo cargar la solicitud" onRetry={refetch} className="py-24" />
    );
  if (isLoading && !request) {
    return (
      <div className="space-y-4">
        <div className="bg-muted/40 h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted/40 h-64 animate-pulse rounded-xl" />
      </div>
    );
  }
  if (!request) return null;

  const serviceFlowSteps = Object.entries(SERVICE_STATUS_LABELS).map(([key, label]) => ({
    key,
    label,
    hint: SERVICE_STATUS_HINTS[key],
  }));

  const nextStatus = STATUS_TRANSITIONS[request.status];
  const canEdit = isClient && request.status === ServiceStatus.OPEN;
  const isTerminal =
    request.status === ServiceStatus.RESOLVED || request.status === ServiceStatus.CLOSED;

  return (
    <div>
      <Link
        href="/service-requests"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Solicitudes
      </Link>
      <PageHeader
        title={request.title}
        description={`Solicitud #${request.id.slice(0, 8)}`}
        action={
          canEdit ? (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
          ) : undefined
        }
      />

      <ServiceDetailTour />
      <div className="space-y-6">
        <Card data-tour="service-info">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Información de la solicitud</CardTitle>
            <Badge variant={SERVICE_STATUS_VARIANT[request.status] ?? 'secondary'}>
              {SERVICE_STATUS_LABELS[request.status] ?? request.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <StatusFlow steps={serviceFlowSteps} current={request.status} />
            </div>
            <div className="bg-muted/40 rounded-lg p-4">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    Título
                  </dt>
                  <dd className="font-medium">{request.title}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5" aria-hidden="true" />
                    Propiedad
                  </dt>
                  <dd className="font-medium">
                    {request.property.address}, {request.property.city}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                    Solicitante
                  </dt>
                  <dd className="font-medium">{request.requester.name}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    Urgencia
                  </dt>
                  <dd>
                    <Badge variant={URGENCY_VARIANT[request.urgency] ?? 'secondary'}>
                      {SERVICE_URGENCY_LABELS[request.urgency] ?? request.urgency}
                    </Badge>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    Fecha de creación
                  </dt>
                  <dd className="font-medium">{formatRelativeDate(new Date(request.createdAt))}</dd>
                </div>
                {request.task && (
                  <div className="space-y-1">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                      Tarea relacionada
                    </dt>
                    <dd className="font-medium">
                      {request.task.category.name} — {request.task.name}
                    </dd>
                  </div>
                )}
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Descripción
                  </dt>
                  <dd className="mt-1 font-medium whitespace-pre-wrap">{request.description}</dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        {request.photos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {request.photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setPreviewPhoto(photo.url)}
                    className="overflow-hidden rounded-md border"
                  >
                    {/* User-uploaded photo — unknown dimensions */}
                    <div className="relative aspect-square w-full">
                      <Image
                        src={photo.url}
                        alt={`Foto adjunta ${request.photos.indexOf(photo) + 1} de ${request.photos.length}`}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isClient && request.status === ServiceStatus.OPEN && (
          <div className="bg-muted/40 text-muted-foreground rounded-lg p-3 text-sm">
            Tu solicitud fue recibida. El equipo de EPDE la revisará y te notificará cuando haya
            novedades.
          </div>
        )}

        {isAdmin && nextStatus && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Nota opcional para el cambio de estado..."
                rows={2}
              />
              <Button onClick={() => setStatusConfirm(nextStatus)}>
                {TRANSITION_LABELS[nextStatus]}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generate budget from service request */}
        {isAdmin && !isTerminal && (
          <Button variant="outline" className="w-full gap-2" onClick={() => setBudgetOpen(true)}>
            <DollarSign className="h-4 w-4" />
            Generar presupuesto para este servicio
          </Button>
        )}

        <ServiceRequestAttachments
          serviceRequestId={id}
          attachments={request.attachments}
          serviceRequestStatus={request.status}
        />

        <div data-tour="service-comments">
          <ServiceRequestComments serviceRequestId={id} serviceRequestStatus={request.status} />
        </div>

        <ServiceRequestTimeline serviceRequestId={id} />
      </div>

      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-[90vw] border-none bg-transparent p-0 shadow-none">
          <VisuallyHidden.Root>
            <DialogTitle>Vista previa de foto</DialogTitle>
          </VisuallyHidden.Root>
          {previewPhoto && (
            <div className="relative h-[85vh] w-full">
              <Image
                src={previewPhoto}
                alt="Vista previa ampliada de foto adjunta"
                fill
                className="rounded-md object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!statusConfirm}
        onOpenChange={() => setStatusConfirm(null)}
        title="Cambiar estado"
        description={`¿Estás seguro de que queres cambiar el estado a "${statusConfirm ? (SERVICE_STATUS_LABELS[statusConfirm] ?? statusConfirm) : ''}"?`}
        variant="default"
        onConfirm={() => {
          if (statusConfirm) {
            updateStatus.mutate(
              { id, status: statusConfirm, note: statusNote.trim() || undefined },
              {
                onSuccess: () => {
                  setStatusConfirm(null);
                  setStatusNote('');
                },
              },
            );
          }
        }}
        isLoading={updateStatus.isPending}
      />

      {canEdit && (
        <EditServiceRequestDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          serviceRequest={request}
        />
      )}

      {/* Budget dialog pre-filled from service request */}
      <CreateBudgetDialog
        open={budgetOpen}
        onOpenChange={setBudgetOpen}
        defaultPropertyId={request.propertyId}
        defaultTitle={`Presupuesto: ${request.title}`}
        defaultDescription={request.description}
      />
    </div>
  );
}
