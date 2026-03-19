'use client';

import type { EditServiceRequestInput, ServiceRequestPublic, ServiceUrgency } from '@epde/shared';
import {
  editServiceRequestSchema,
  SERVICE_URGENCY_LABELS,
  SERVICE_URGENCY_VALUES,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useEditServiceRequest } from '@/hooks/use-service-requests';

interface EditServiceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequest: ServiceRequestPublic;
}

export function EditServiceRequestDialog({
  open,
  onOpenChange,
  serviceRequest,
}: EditServiceRequestDialogProps) {
  const editMutation = useEditServiceRequest();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditServiceRequestInput>({
    resolver: zodResolver(editServiceRequestSchema),
    defaultValues: {
      title: serviceRequest.title,
      description: serviceRequest.description,
      urgency: serviceRequest.urgency,
    },
  });

  const onSubmit = handleSubmit((data) => {
    editMutation.mutate(
      { id: serviceRequest.id, ...data },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar solicitud</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input id="edit-title" {...register('title')} />
            {errors.title && (
              <p role="alert" className="text-destructive text-sm">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea id="edit-description" {...register('description')} rows={4} />
            {errors.description && (
              <p role="alert" className="text-destructive text-sm">
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-urgency">Urgencia</Label>
            <Controller
              control={control}
              name="urgency"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as ServiceUrgency)}
                >
                  <SelectTrigger id="edit-urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_URGENCY_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {SERVICE_URGENCY_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.urgency && (
              <p role="alert" className="text-destructive text-sm">
                {errors.urgency.message}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
