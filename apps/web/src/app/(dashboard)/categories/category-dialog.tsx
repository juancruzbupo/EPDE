'use client';

import { type CreateCategoryInput, createCategorySchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

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
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories';
import { useCategoryTemplates } from '@/hooks/use-category-templates';
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
  const { data: categoryTemplates } = useCategoryTemplates();

  const {
    register,
    handleSubmit,
    reset,
    control,
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
        categoryTemplateId: category.categoryTemplateId ?? undefined,
      });
    } else {
      reset({ name: '', description: '', icon: '', order: 0, categoryTemplateId: undefined });
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
          <DialogDescription>Configurá el nombre y el ícono de la categoría.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="Ej: Estructura"
                aria-describedby={errors.name ? 'cat-name-error' : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p id="cat-name-error" role="alert" className="text-destructive text-xs">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-order">
                Orden <span className="text-destructive">*</span>
              </Label>
              <Input id="cat-order" type="number" min={0} placeholder="0" {...register('order')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-description" className="text-muted-foreground">
              Descripción
            </Label>
            <Input id="cat-description" {...register('description')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-icon" className="text-muted-foreground">
              Ícono
            </Label>
            <Input id="cat-icon" {...register('icon')} placeholder="ej: zap, home, droplet..." />
            <p className="text-muted-foreground text-xs">
              Nombre del ícono de Lucide. Ver lucide.dev/icons para referencia.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Plantilla vinculada</Label>
            <Controller
              control={control}
              name="categoryTemplateId"
              render={({ field }) => (
                <Select
                  value={field.value ?? '__none__'}
                  onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin plantilla</SelectItem>
                    {categoryTemplates?.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.icon && <span className="mr-1">{ct.icon}</span>}
                        {ct.name} ({ct.tasks.length} tareas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
