'use client';

import type { CreateCategoryTemplateInput } from '@epde/shared';
import type { CategoryTemplate } from '@epde/shared';
import { createCategoryTemplateSchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
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
import {
  useCreateCategoryTemplate,
  useUpdateCategoryTemplate,
} from '@/hooks/use-category-templates';

interface CategoryTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryTemplate | null;
}

export function CategoryTemplateDialog({
  open,
  onOpenChange,
  category,
}: CategoryTemplateDialogProps) {
  const isEdit = !!category;
  const createCategory = useCreateCategoryTemplate();
  const updateCategory = useUpdateCategoryTemplate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryTemplateInput>({
    // zodResolver + z.default() causes input/output type mismatch — safe to cast
    resolver: zodResolver(createCategoryTemplateSchema) as never,
    defaultValues: { name: '', description: '', icon: '', displayOrder: 0 },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description ?? '',
        icon: category.icon ?? '',
        displayOrder: category.displayOrder,
      });
    } else {
      reset({ name: '', description: '', icon: '', displayOrder: 0 });
    }
  }, [category, reset]);

  const onSubmit = (data: CreateCategoryTemplateInput) => {
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
          <DialogTitle>
            {isEdit ? 'Editar Categoría Template' : 'Nueva Categoría Template'}
          </DialogTitle>
          <DialogDescription>Configurá el nombre de la plantilla de categoría.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tpl-cat-name">Nombre</Label>
            <Input
              id="tpl-cat-name"
              aria-describedby={errors.name ? 'tpl-cat-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="tpl-cat-name-error" role="alert" className="text-destructive text-sm">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-cat-description">Descripción (opcional)</Label>
            <Input id="tpl-cat-description" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tpl-cat-icon">Ícono (opcional)</Label>
              <Input id="tpl-cat-icon" {...register('icon')} placeholder="ej: zap, home..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-cat-order">Orden</Label>
              <Input id="tpl-cat-order" type="number" min={0} {...register('displayOrder')} />
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
