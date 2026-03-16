'use client';

import type { PropertyPublic, PropertySector, UpdatePropertyInput } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS, PROPERTY_TYPE_LABELS, updatePropertySchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { useUpdateProperty } from '@/hooks/use-properties';

interface EditPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: PropertyPublic;
}

export function EditPropertyDialog({ open, onOpenChange, property }: EditPropertyDialogProps) {
  const updateMutation = useUpdateProperty();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdatePropertyInput>({
    resolver: zodResolver(updatePropertySchema),
    defaultValues: {
      address: property.address,
      city: property.city,
      type: property.type,
      activeSectors: property.activeSectors,
      yearBuilt: property.yearBuilt ?? undefined,
      squareMeters: property.squareMeters ?? undefined,
    },
  });

  const [sectors, setSectors] = useState<PropertySector[]>(
    (property.activeSectors as PropertySector[]) ?? [],
  );

  const toggleSector = (sector: PropertySector) => {
    setSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector],
    );
  };

  const onSubmit = handleSubmit((data) => {
    updateMutation.mutate(
      { id: property.id, ...data, activeSectors: sectors },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar propiedad</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-address">
                Dirección <span className="text-destructive">*</span>
              </Label>
              <Input id="edit-address" {...register('address')} />
              {errors.address && (
                <p className="text-destructive text-xs">{errors.address.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-city">
                Ciudad <span className="text-destructive">*</span>
              </Label>
              <Input id="edit-city" {...register('city')} />
              {errors.city && <p className="text-destructive text-xs">{errors.city.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-type">Tipo</Label>
            <Select
              defaultValue={property.type}
              onValueChange={(v) => setValue('type', v as UpdatePropertyInput['type'])}
            >
              <SelectTrigger id="edit-type">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-year" className="text-muted-foreground">
                Año de construcción
              </Label>
              <Input
                id="edit-year"
                type="number"
                {...register('yearBuilt', {
                  setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                })}
              />
              {errors.yearBuilt && (
                <p className="text-destructive text-sm">{errors.yearBuilt.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sqm" className="text-muted-foreground">
                Metros cuadrados
              </Label>
              <Input
                id="edit-sqm"
                type="number"
                step="0.1"
                {...register('squareMeters', {
                  setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                })}
              />
              {errors.squareMeters && (
                <p className="text-destructive text-sm">{errors.squareMeters.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Sectores activos</Label>
            <p className="text-muted-foreground text-xs">
              Desmarcá los sectores que no aplican a esta propiedad.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PROPERTY_SECTOR_LABELS).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sectors.includes(value as PropertySector)}
                    onChange={() => toggleSector(value as PropertySector)}
                    className="accent-primary h-4 w-4 rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
