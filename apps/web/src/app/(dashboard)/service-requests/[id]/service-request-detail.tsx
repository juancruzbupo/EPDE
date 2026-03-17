'use client';

import type { ServiceRequestPublic } from '@epde/shared';
import {
  formatRelativeDate,
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
  FileText,
  Home,
  Pencil,
  User,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useServiceRequest, useUpdateServiceStatus } from '@/hooks/use-service-requests';

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
  [ServiceStatus.IN_REVIEW]: 'Pasar a En Revision',
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

  const nextStatus = STATUS_TRANSITIONS[request.status];
  const canEdit = isClient && request.status === ServiceStatus.OPEN;

  return (
    <div>
      <PageHeader
        title={request.title}
        description={`Solicitud #${request.id.slice(0, 8)}`}
        action={
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/service-requests">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Información de la solicitud</CardTitle>
            <Badge variant={SERVICE_STATUS_VARIANT[request.status] ?? 'secondary'}>
              {SERVICE_STATUS_LABELS[request.status] ?? request.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-lg p-4">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Título
                  </dt>
                  <dd className="font-medium">{request.title}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5" />
                    Propiedad
                  </dt>
                  <dd className="font-medium">
                    {request.property.address}, {request.property.city}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Solicitante
                  </dt>
                  <dd className="font-medium">{request.requester.name}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
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
                    <Calendar className="h-3.5 w-3.5" />
                    Fecha de creación
                  </dt>
                  <dd className="font-medium">{formatRelativeDate(new Date(request.createdAt))}</dd>
                </div>
                {request.task && (
                  <div className="space-y-1">
                    <dt className="text-muted-foreground flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" />
                      Tarea relacionada
                    </dt>
                    <dd className="font-medium">
                      {request.task.category.name} — {request.task.name}
                    </dd>
                  </div>
                )}
                <div className="space-y-1 sm:col-span-2">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5" />
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
                    <img
                      src={photo.url}
                      alt="Foto de solicitud"
                      className="aspect-square w-full object-cover transition-transform hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
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

        <ServiceRequestAttachments
          serviceRequestId={id}
          attachments={request.attachments}
          serviceRequestStatus={request.status}
        />

        <ServiceRequestComments serviceRequestId={id} serviceRequestStatus={request.status} />

        <ServiceRequestTimeline serviceRequestId={id} />
      </div>

      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-[90vw] border-none bg-transparent p-0 shadow-none">
          {/* Fullscreen preview — user-uploaded photo, unknown dimensions */}
          <img
            src={previewPhoto ?? ''}
            alt="Vista previa de foto"
            className="max-h-[85vh] w-full rounded-md object-contain"
          />
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
    </div>
  );
}
