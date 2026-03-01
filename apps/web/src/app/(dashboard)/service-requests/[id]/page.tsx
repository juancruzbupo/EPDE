'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useServiceRequest, useUpdateServiceStatus } from '@/hooks/use-service-requests';
import { PageHeader } from '@/components/page-header';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  FileText,
  Home,
  User,
  AlertTriangle,
  Calendar,
  AlignLeft,
  Wrench,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { SERVICE_URGENCY_LABELS, SERVICE_STATUS_LABELS, UserRole } from '@epde/shared';
import Link from 'next/link';
import { urgencyVariant, serviceStatusVariant } from '@/lib/style-maps';

const STATUS_TRANSITIONS: Record<string, string> = {
  OPEN: 'IN_REVIEW',
  IN_REVIEW: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
};

const TRANSITION_LABELS: Record<string, string> = {
  IN_REVIEW: 'Pasar a En Revision',
  IN_PROGRESS: 'Pasar a En Progreso',
  RESOLVED: 'Marcar como Resuelto',
  CLOSED: 'Cerrar solicitud',
};

export default function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;

  const { data, isLoading } = useServiceRequest(id);
  const updateStatus = useUpdateServiceStatus();

  const [statusConfirm, setStatusConfirm] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const request = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-1.5 h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-lg p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center gap-2 py-16">
        <Wrench className="text-muted-foreground/50 h-10 w-10" />
        <p className="text-muted-foreground text-sm">Solicitud no encontrada</p>
        <Button variant="outline" asChild className="mt-2">
          <Link href="/service-requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a solicitudes
          </Link>
        </Button>
      </div>
    );
  }

  const nextStatus = STATUS_TRANSITIONS[request.status];

  return (
    <div>
      <PageHeader
        title={request.title}
        description={`Solicitud #${request.id.slice(0, 8)}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/service-requests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Información de la solicitud</CardTitle>
            <Badge variant={serviceStatusVariant[request.status] ?? 'secondary'}>
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
                    <Badge variant={urgencyVariant[request.urgency] ?? 'outline'}>
                      {SERVICE_URGENCY_LABELS[request.urgency] ?? request.urgency}
                    </Badge>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Fecha de creación
                  </dt>
                  <dd className="font-medium">
                    {formatDistanceToNow(new Date(request.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </dd>
                </div>
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
            <CardContent className="flex gap-2 p-4">
              <Button onClick={() => setStatusConfirm(nextStatus)}>
                {TRANSITION_LABELS[nextStatus]}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-[90vw] border-none bg-transparent p-0 shadow-none">
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
              { id, status: statusConfirm },
              { onSuccess: () => setStatusConfirm(null) },
            );
          }
        }}
        isLoading={updateStatus.isPending}
      />
    </div>
  );
}
