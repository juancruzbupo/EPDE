'use client';

import type { TechnicalInspectionPublic } from '@epde/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCancelTechnicalInspection,
  useMarkTechnicalInspectionPaid,
  useScheduleTechnicalInspection,
  useUpdateTechnicalInspectionStatus,
  useUploadTechnicalInspectionDeliverable,
} from '@/hooks/use-technical-inspections';
import { useUploadFile } from '@/hooks/use-upload';
import { ROUTES } from '@/lib/routes';

interface Props {
  inspection: TechnicalInspectionPublic;
}

export function AdminActionsCard({ inspection }: Props) {
  const router = useRouter();
  const schedule = useScheduleTechnicalInspection(inspection.id);
  const updateStatus = useUpdateTechnicalInspectionStatus(inspection.id);
  const uploadDeliverable = useUploadTechnicalInspectionDeliverable(inspection.id);
  const markPaid = useMarkTechnicalInspectionPaid(inspection.id);
  const cancel = useCancelTechnicalInspection();
  const uploadFile = useUploadFile();

  const [scheduledFor, setScheduledFor] = useState('');
  const [adminNotes, setAdminNotes] = useState(inspection.adminNotes ?? '');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);

  const canSchedule = inspection.status === 'REQUESTED' || inspection.status === 'SCHEDULED';
  const canStart = inspection.status === 'SCHEDULED';
  const canUploadDeliverable =
    inspection.status === 'IN_PROGRESS' || inspection.status === 'SCHEDULED';
  const canMarkPaid = inspection.status === 'REPORT_READY' && !!inspection.deliverableUrl;
  const canCancel = inspection.status !== 'PAID' && inspection.status !== 'CANCELED';

  const handleSchedule = () => {
    if (!scheduledFor) return;
    schedule.mutate({
      scheduledFor: new Date(scheduledFor).toISOString(),
      adminNotes: adminNotes.trim() || undefined,
    });
  };

  const handleStart = () => {
    updateStatus.mutate({
      status: 'IN_PROGRESS',
      adminNotes: adminNotes.trim() || undefined,
    });
  };

  const handleUploadDeliverable = async (file: File) => {
    const url = await uploadFile.mutateAsync({ file, folder: 'technical-inspections' });
    uploadDeliverable.mutate({ deliverableUrl: url, deliverableFileName: file.name });
  };

  const handleMarkPaid = () => {
    if (!paymentMethod) return;
    markPaid.mutate({ paymentMethod });
  };

  const handleCancel = () => {
    cancel.mutate(inspection.id, {
      onSuccess: () => router.push(ROUTES.technicalInspections),
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones de admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {canSchedule && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Agendar visita</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="scheduledFor" className="text-xs">
                    Fecha y hora
                  </Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="adminNotes" className="text-xs">
                    Notas internas
                  </Label>
                  <Textarea
                    id="adminNotes"
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleSchedule}
                disabled={!scheduledFor || schedule.isPending}
              >
                {schedule.isPending ? 'Guardando...' : 'Agendar'}
              </Button>
            </div>
          )}

          {canStart && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Marcar visita en curso</p>
              <p className="text-muted-foreground text-xs">
                Úselo cuando estés realizando la visita en sitio.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleStart}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Actualizando...' : 'Pasar a en curso'}
              </Button>
            </div>
          )}

          {canUploadDeliverable && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Subir informe firmado (PDF)</p>
              <p className="text-muted-foreground text-xs">
                Al subirlo, pasa a &laquo;Informe listo&raquo; y el cliente puede pagar.
              </p>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadDeliverable(file);
                }}
                disabled={uploadFile.isPending || uploadDeliverable.isPending}
              />
            </div>
          )}

          {canMarkPaid && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Registrar pago</p>
              <div className="space-y-1">
                <Label htmlFor="paymentMethod" className="text-xs">
                  Método
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia bancaria</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="mercadopago">MercadoPago</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                onClick={handleMarkPaid}
                disabled={!paymentMethod || markPaid.isPending}
              >
                {markPaid.isPending ? 'Registrando...' : 'Marcar como pagado'}
              </Button>
            </div>
          )}

          {canCancel && (
            <div className="border-t pt-3">
              <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)}>
                Cancelar informe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar informe"
        description="Esta acción no se puede deshacer. El cliente será notificado."
        onConfirm={handleCancel}
        isLoading={cancel.isPending}
        confirmLabel="Sí, cancelar"
      />
    </>
  );
}
