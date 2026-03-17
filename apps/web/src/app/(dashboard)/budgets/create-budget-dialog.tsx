'use client';

import { type CreateBudgetRequestInput, createBudgetRequestSchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateBudgetRequest } from '@/hooks/use-budgets';
import { useDraft } from '@/hooks/use-draft';
import { useProperties } from '@/hooks/use-properties';

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the property selector when opening from a task context. */
  defaultPropertyId?: string;
  /** Pre-fill the title field. */
  defaultTitle?: string;
  /** Pre-fill the description field. */
  defaultDescription?: string;
}

export function CreateBudgetDialog({
  open,
  onOpenChange,
  defaultPropertyId,
  defaultTitle,
  defaultDescription,
}: CreateBudgetDialogProps) {
  const createBudget = useCreateBudgetRequest();
  const { data: propertiesData } = useProperties({});

  const properties = useMemo(
    () => propertiesData?.pages.flatMap((p) => p.data) ?? [],
    [propertiesData],
  );

  const form = useForm<CreateBudgetRequestInput>({
    resolver: zodResolver(createBudgetRequestSchema),
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // Disable draft when pre-filling from task context
  const hasDefaults = !!(defaultPropertyId || defaultTitle);
  const { clearDraft } = useDraft('draft:budget:create', form, open && !hasDefaults);

  // Pre-fill property when provided (e.g. from task detail sheet)
  useEffect(() => {
    if (open && defaultPropertyId) {
      setValue('propertyId', defaultPropertyId, { shouldValidate: true });
    }
    if (open && defaultTitle) {
      setValue('title', defaultTitle);
    }
    if (open && defaultDescription) {
      setValue('description', defaultDescription);
    }
  }, [open, defaultPropertyId, defaultTitle, defaultDescription, setValue]);

  const selectedPropertyId = watch('propertyId');

  const onSubmit = (data: CreateBudgetRequestInput) => {
    createBudget.mutate(data, {
      onSuccess: () => {
        clearDraft();
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar Presupuesto</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Solicitá un presupuesto para tu propiedad.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="propertyId">
              Propiedad <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedPropertyId ?? ''}
              onValueChange={(value) => setValue('propertyId', value, { shouldValidate: true })}
            >
              <SelectTrigger
                id="propertyId"
                className="w-full"
                aria-invalid={!!errors.propertyId}
                aria-describedby={errors.propertyId ? 'property-error' : undefined}
              >
                <SelectValue placeholder="Seleccionar propiedad" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}, {property.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && (
              <p id="property-error" role="alert" className="text-destructive text-sm">
                {errors.propertyId.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ej: Reparación de techo"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
              {...register('title')}
            />
            {errors.title && (
              <p id="title-error" role="alert" className="text-destructive text-xs">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-muted-foreground">
              Descripción
            </Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="Detalles adicionales sobre el trabajo necesario..."
              {...register('description')}
            />
            {errors.description && (
              <p className="text-destructive text-sm">{errors.description.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createBudget.isPending}>
              {createBudget.isPending ? 'Enviando...' : 'Solicitar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
