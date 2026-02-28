'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type CreateCategoryInput } from '@epde/shared/schemas';
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CategoryPublic } from '@/lib/api/categories';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryPublic | null;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const isEdit = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description ?? '',
        icon: category.icon ?? '',
        order: category.order,
      });
    } else {
      reset({ name: '', description: '', icon: '', order: 0 });
    }
  }, [category, reset]);

  const onSubmit = (data: CreateCategoryInput) => {
    if (isEdit) {
      updateCategory.mutate(
        { id: category!.id, ...data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createCategory.mutate(data, {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      });
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nombre</Label>
            <Input id="cat-name" {...register('name')} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-description">Descripción (opcional)</Label>
            <Input id="cat-description" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Ícono (opcional)</Label>
              <Input id="cat-icon" {...register('icon')} placeholder="ej: zap, home..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Orden</Label>
              <Input id="cat-order" type="number" min={0} {...register('order')} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
