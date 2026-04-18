'use client';

import {
  type CreateTechnicalInspectionInput,
  createTechnicalInspectionSchema,
  formatARSCompact,
  TECHNICAL_INSPECTION_ACTIVITIES,
  TECHNICAL_INSPECTION_DESCRIPTIONS,
  TECHNICAL_INSPECTION_ESTIMATED_DAYS,
  TECHNICAL_INSPECTION_LABELS,
  TECHNICAL_INSPECTION_PRICES,
  TECHNICAL_INSPECTION_TOOLS,
  TECHNICAL_INSPECTION_TYPE_VALUES,
  type TechnicalInspectionType,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ClipboardList, Clock, Info, Wrench } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useProperties } from '@/hooks/use-properties';
import { useCreateTechnicalInspection } from '@/hooks/use-technical-inspections';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPropertyId?: string;
}

export function CreateInspectionDialog({ open, onOpenChange, defaultPropertyId }: Props) {
  const createInspection = useCreateTechnicalInspection();
  const { data: propertiesData } = useProperties({});
  const properties = propertiesData?.pages.flatMap((p) => p.data) ?? [];

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTechnicalInspectionInput>({
    resolver: zodResolver(createTechnicalInspectionSchema),
    defaultValues: { type: 'BASIC' },
  });

  useEffect(() => {
    if (open && defaultPropertyId) {
      setValue('propertyId', defaultPropertyId, { shouldValidate: true });
    }
  }, [open, defaultPropertyId, setValue]);

  const selectedType = watch('type');

  const onSubmit = (data: CreateTechnicalInspectionInput) => {
    createInspection.mutate(data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar inspección técnica</DialogTitle>
          <DialogDescription>
            Servicio profesional firmado por Arq. Noelia Yuskowich. Se paga al entregar el informe.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-primary/30 bg-primary/5">
          <Info aria-hidden="true" />
          <AlertTitle>Precio exclusivo para clientes activos EPDE</AlertTitle>
          <AlertDescription>
            Tenés un 15% de descuento sobre el precio público. Ya está aplicado debajo.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="propertyId">
              Propiedad <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="propertyId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="propertyId" className="w-full">
                    <SelectValue placeholder="Seleccionar propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.address}, {p.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.propertyId && (
              <p role="alert" className="text-destructive text-sm">
                {errors.propertyId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Tipo de inspección <span className="text-destructive">*</span>
            </Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {TECHNICAL_INSPECTION_TYPE_VALUES.map((type) => {
                const isSelected = selectedType === type;
                const price = TECHNICAL_INSPECTION_PRICES[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue('type', type as TechnicalInspectionType)}
                    className={cn(
                      'relative rounded-lg border p-3 text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-primary/30 ring-2'
                        : 'hover:bg-muted/40',
                    )}
                  >
                    {isSelected && (
                      <Check className="text-primary absolute top-2 right-2 h-4 w-4" />
                    )}
                    <p className="text-sm font-semibold">{TECHNICAL_INSPECTION_LABELS[type]}</p>
                    <p className="text-primary mt-2 text-lg font-bold tabular-nums">
                      {formatARSCompact(price.client)}
                    </p>
                    <p className="text-muted-foreground text-xs tabular-nums line-through">
                      Público {formatARSCompact(price.public)}
                    </p>
                    <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {TECHNICAL_INSPECTION_ESTIMATED_DAYS[type]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedType && (
            <div className="space-y-3">
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <p className="text-sm leading-relaxed">
                    {TECHNICAL_INSPECTION_DESCRIPTIONS[selectedType]}
                  </p>
                </CardContent>
              </Card>

              <details className="bg-card group rounded-lg border">
                <summary className="text-foreground hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded-lg p-3 text-sm font-medium">
                  <ClipboardList className="text-primary h-4 w-4" />
                  Actividades incluidas ({TECHNICAL_INSPECTION_ACTIVITIES[selectedType].length})
                </summary>
                <ul className="text-muted-foreground list-disc space-y-1.5 px-8 pb-3 text-sm leading-relaxed">
                  {TECHNICAL_INSPECTION_ACTIVITIES[selectedType].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </details>

              <details className="bg-card rounded-lg border">
                <summary className="text-foreground hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded-lg p-3 text-sm font-medium">
                  <Wrench className="text-primary h-4 w-4" />
                  Equipamiento que trae la arquitecta (
                  {TECHNICAL_INSPECTION_TOOLS[selectedType].length})
                </summary>
                <ul className="text-muted-foreground list-disc space-y-1.5 px-8 pb-3 text-sm leading-relaxed">
                  {TECHNICAL_INSPECTION_TOOLS[selectedType].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </details>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="clientNotes">Notas (opcional)</Label>
            <Textarea
              id="clientNotes"
              rows={3}
              placeholder="Contexto, accesos, horarios preferidos..."
              {...register('clientNotes')}
            />
          </div>

          <Alert variant="default">
            <Info aria-hidden="true" />
            <AlertDescription>
              <strong>Cómo sigue:</strong> recibís confirmación, coordinamos la visita, entregamos
              el informe firmado y recién ahí pagás por transferencia bancaria.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createInspection.isPending}>
              {createInspection.isPending ? 'Enviando...' : 'Solicitar inspección'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
