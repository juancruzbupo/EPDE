'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { respondBudgetSchema, type RespondBudgetInput } from '@epde/shared';
import { useRespondToBudget } from '@/hooks/use-budgets';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface RespondBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
}

export function RespondBudgetDialog({ open, onOpenChange, budgetId }: RespondBudgetDialogProps) {
  const respondToBudget = useRespondToBudget();

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
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const watchedLineItems = watch('lineItems');

  const total =
    watchedLineItems?.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0) ?? 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);

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
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Line Items */}
          <div className="space-y-3">
            <Label>Items</Label>
            {fields.map((field, index) => {
              const qty = Number(watchedLineItems?.[index]?.quantity) || 0;
              const price = Number(watchedLineItems?.[index]?.unitPrice) || 0;
              const subtotal = qty * price;

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_80px_100px_100px_40px] items-start gap-2"
                >
                  <div>
                    <Input
                      placeholder="Descripcion"
                      {...register(`lineItems.${index}.description`)}
                    />
                    {errors.lineItems?.[index]?.description && (
                      <p className="text-destructive mt-1 text-xs">
                        {errors.lineItems[index].description.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Cant."
                      min={1}
                      max={99999}
                      {...register(`lineItems.${index}.quantity`)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="P. Unit."
                      min={0}
                      max={999999999}
                      step="0.01"
                      {...register(`lineItems.${index}.unitPrice`)}
                    />
                  </div>
                  <div className="text-muted-foreground flex h-9 items-center px-2 text-sm">
                    {formatCurrency(subtotal)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="h-9 w-9 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {errors.lineItems?.root && (
              <p className="text-destructive text-sm">{errors.lineItems.root.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar item
            </Button>
          </div>

          {/* Total */}
          <div className="flex justify-end border-t pt-3">
            <p className="text-lg font-semibold">Total: {formatCurrency(total)}</p>
          </div>

          {/* Extra fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estimatedDays">Días estimados</Label>
              <Input
                id="estimatedDays"
                type="number"
                min={1}
                max={365}
                {...register('estimatedDays', {
                  setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                })}
              />
              {errors.estimatedDays && (
                <p className="text-destructive text-sm">{errors.estimatedDays.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Válido hasta</Label>
              <Input
                id="validUntil"
                type="date"
                {...register('validUntil', {
                  setValueAs: (v: string) => (v === '' ? undefined : v),
                })}
              />
              {errors.validUntil && (
                <p className="text-destructive text-sm">{errors.validUntil.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea
              id="notes"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              {...register('notes')}
            />
            {errors.notes && <p className="text-destructive text-sm">{errors.notes.message}</p>}
          </div>

          <div className="flex justify-end gap-2">
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
