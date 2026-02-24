'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPropertySchema, PROPERTY_TYPE_LABELS } from '@epde/shared';
import { z } from 'zod';

type PropertyFormValues = z.input<typeof createPropertySchema>;
import { useCreateProperty } from '@/hooks/use-properties';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreatePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePropertyDialog({ open, onOpenChange }: CreatePropertyDialogProps) {
  const createProperty = useCreateProperty();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: { type: 'HOUSE' },
  });

  const onSubmit = (data: PropertyFormValues) => {
    createProperty.mutate(data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Propiedad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>ID del Cliente</Label>
            <Input {...register('userId')} placeholder="UUID del cliente" />
            {errors.userId && <p className="text-destructive text-sm">{errors.userId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input {...register('address')} />
            {errors.address && <p className="text-destructive text-sm">{errors.address.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Input {...register('city')} />
            {errors.city && <p className="text-destructive text-sm">{errors.city.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              defaultValue="HOUSE"
              onValueChange={(v) => setValue('type', v as PropertyFormValues['type'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Año de construcción</Label>
              <Input type="number" {...register('yearBuilt')} />
            </div>
            <div className="space-y-2">
              <Label>Metros cuadrados</Label>
              <Input type="number" step="0.1" {...register('squareMeters')} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createProperty.isPending}>
              {createProperty.isPending ? 'Creando...' : 'Crear Propiedad'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
