'use client';

import {
  type BudgetLineItemPublic,
  formatARS,
  type RespondBudgetInput,
  respondBudgetSchema,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useRespondToBudget } from '@/hooks/use-budgets';
import { useQuoteTemplates } from '@/hooks/use-quote-templates';
import type { QuoteTemplatePublic } from '@/lib/api/quote-templates';

interface RespondBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
  initialLineItems?: BudgetLineItemPublic[];
  initialEstimatedDays?: number | null;
  initialValidUntil?: string | null;
  initialNotes?: string | null;
}

export function RespondBudgetDialog({
  open,
  onOpenChange,
  budgetId,
  initialLineItems,
  initialEstimatedDays,
  initialValidUntil,
  initialNotes,
}: RespondBudgetDialogProps) {
  const respondToBudget = useRespondToBudget();
  const { data: quoteTemplates } = useQuoteTemplates();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<RespondBudgetInput>({
    resolver: zodResolver(respondBudgetSchema),
    defaultValues: {
      lineItems: initialLineItems?.length
        ? initialLineItems.map((li) => ({
            description: li.description,
            quantity: Number(li.quantity),
            unitPrice: Number(li.unitPrice),
          }))
        : [{ description: '', quantity: 1, unitPrice: 0 }],
      estimatedDays: initialEstimatedDays ?? undefined,
      validUntil: initialValidUntil ?? undefined,
      notes: initialNotes ?? undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  const watchedLineItems = watch('lineItems');
  const total =
    watchedLineItems?.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0) ?? 0;

  const handleTemplateSelect = (templateId: string) => {
    const template = quoteTemplates?.find((t: QuoteTemplatePublic) => t.id === templateId);
    if (template) {
      while (fields.length > 0) remove(0);
      template.items.forEach((item: QuoteTemplatePublic['items'][number]) =>
        append({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        }),
      );
    }
  };

  const onSubmit = (data: RespondBudgetInput) => {
    respondToBudget.mutate(
      { id: budgetId, ...data },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cotizar Presupuesto</DialogTitle>
          <DialogDescription>
            Completá la cotización con los ítems y días estimados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ─── Template selector ─── */}
          {quoteTemplates && quoteTemplates.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Usar plantilla</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Cargar items desde plantilla..." />
                </SelectTrigger>
                <SelectContent>
                  {quoteTemplates.map((t: QuoteTemplatePublic) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.items.length} items)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Reemplaza los items actuales con los de la plantilla seleccionada.
              </p>
            </div>
          )}

          {/* ─── Line Items ─── */}
          <fieldset className="space-y-3">
            <legend className="text-foreground mb-1 text-sm font-semibold">
              Items <span className="text-destructive">*</span>
            </legend>

            {/* Header row */}
            <div className="text-muted-foreground grid grid-cols-[1fr_70px_90px_90px_36px] gap-2 text-xs">
              <span>Descripción</span>
              <span>Cant.</span>
              <span>P. Unitario</span>
              <span>Subtotal</span>
              <span />
            </div>

            {fields.map((field, index) => {
              const qty = Number(watchedLineItems?.[index]?.quantity) || 0;
              const price = Number(watchedLineItems?.[index]?.unitPrice) || 0;
              const subtotal = qty * price;

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_70px_90px_90px_36px] items-start gap-2"
                >
                  <div>
                    <Input
                      placeholder="Descripción del item"
                      className="h-9 text-sm"
                      aria-describedby={
                        errors.lineItems?.[index]?.description
                          ? `lineItem-${index}-desc-error`
                          : undefined
                      }
                      {...register(`lineItems.${index}.description`)}
                    />
                    {errors.lineItems?.[index]?.description && (
                      <p
                        id={`lineItem-${index}-desc-error`}
                        role="alert"
                        className="text-destructive mt-0.5 text-xs"
                      >
                        {errors.lineItems[index].description.message}
                      </p>
                    )}
                  </div>
                  <Input
                    type="number"
                    placeholder="1"
                    min={1}
                    className="h-9 text-sm"
                    {...register(`lineItems.${index}.quantity`)}
                  />
                  <Input
                    type="number"
                    placeholder="0"
                    min={0}
                    step="0.01"
                    className="h-9 text-sm"
                    {...register(`lineItems.${index}.unitPrice`)}
                  />
                  <div className="text-muted-foreground flex h-9 items-center text-sm tabular-nums">
                    {formatARS(subtotal)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="h-9 w-9 p-0"
                    aria-label="Eliminar item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}

            {errors.lineItems?.root && (
              <p role="alert" className="text-destructive text-xs">
                {errors.lineItems.root.message}
              </p>
            )}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Agregar item
              </Button>
              <p className="text-foreground text-base font-semibold tabular-nums">
                Total: {formatARS(total)}
              </p>
            </div>
          </fieldset>

          {/* ─── Condiciones ─── */}
          <fieldset className="space-y-3">
            <legend className="text-foreground mb-1 text-sm font-semibold">Condiciones</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="estimatedDays" className="text-muted-foreground">
                  Días estimados
                </Label>
                <Input
                  id="estimatedDays"
                  type="number"
                  min={1}
                  max={365}
                  placeholder="Ej: 5"
                  aria-describedby={errors.estimatedDays ? 'estimatedDays-error' : undefined}
                  {...register('estimatedDays', {
                    setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                  })}
                />
                {errors.estimatedDays && (
                  <p id="estimatedDays-error" role="alert" className="text-destructive text-xs">
                    {errors.estimatedDays.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="validUntil" className="text-muted-foreground">
                  Válido hasta
                </Label>
                <Input
                  id="validUntil"
                  type="date"
                  {...register('validUntil', {
                    setValueAs: (v: string) => (v === '' ? undefined : v),
                  })}
                />
                <p className="text-muted-foreground text-xs">Fecha límite de la cotización.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-muted-foreground">
                Notas
              </Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Ej: Incluye materiales y mano de obra. Garantía 2 años."
                {...register('notes')}
              />
            </div>
          </fieldset>

          {/* ─── Actions ─── */}
          <div className="border-border flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={respondToBudget.isPending}>
              {respondToBudget.isPending ? 'Enviando...' : 'Enviar Cotización'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
