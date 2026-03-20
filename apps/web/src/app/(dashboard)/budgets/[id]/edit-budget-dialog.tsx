'use client';

import type { BudgetRequestPublic, EditBudgetRequestInput } from '@epde/shared';
import { editBudgetRequestSchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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
import { Textarea } from '@/components/ui/textarea';
import { useEditBudgetRequest } from '@/hooks/use-budgets';

interface EditBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: BudgetRequestPublic;
}

export function EditBudgetDialog({ open, onOpenChange, budget }: EditBudgetDialogProps) {
  const editMutation = useEditBudgetRequest();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditBudgetRequestInput>({
    resolver: zodResolver(editBudgetRequestSchema),
    defaultValues: {
      title: budget.title,
      description: budget.description ?? '',
    },
  });

  const onSubmit = handleSubmit((data) => {
    editMutation.mutate(
      { id: budget.id, ...data },
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
          <DialogTitle>Editar presupuesto</DialogTitle>
          <DialogDescription>Modificá los datos del presupuesto.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              aria-describedby={errors.title ? 'edit-budget-title-error' : undefined}
              {...register('title')}
            />
            {errors.title && (
              <p id="edit-budget-title-error" role="alert" className="text-destructive text-xs">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-description" className="text-muted-foreground">
              Descripción
            </Label>
            <Textarea
              id="edit-description"
              aria-describedby={errors.description ? 'edit-budget-description-error' : undefined}
              {...register('description')}
              rows={2}
            />
            {errors.description && (
              <p
                id="edit-budget-description-error"
                role="alert"
                className="text-destructive text-sm"
              >
                {errors.description.message}
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
