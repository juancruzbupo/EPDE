'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Bug,
  Building,
  DoorOpen,
  Droplet,
  Droplets,
  FireExtinguisher,
  Flame,
  Home,
  Layers,
  Paintbrush,
  Pencil,
  Plus,
  Thermometer,
  Trash2,
  Trees,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/** Curated map of icons used by category templates (seed data). */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  building: Building,
  home: Home,
  zap: Zap,
  droplets: Droplets,
  droplet: Droplet,
  flame: Flame,
  'door-open': DoorOpen,
  paintbrush: Paintbrush,
  trees: Trees,
  thermometer: Thermometer,
  'fire-extinguisher': FireExtinguisher,
  bug: Bug,
  layers: Layers,
};

function renderCategoryIcon(iconName: string | null): React.ReactNode {
  if (!iconName) return '\u2014';
  const Icon = CATEGORY_ICON_MAP[iconName.toLowerCase()];
  if (!Icon) return iconName;
  return <Icon className="h-4 w-4" />;
}

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCategories, useDeleteCategory } from '@/hooks/use-categories';
import { useCategoryTemplates } from '@/hooks/use-category-templates';
import { useDebounce } from '@/hooks/use-debounce';
import type { CategoryPublic } from '@/lib/api/categories';

import { CategoryDialog } from './category-dialog';

export default function CategoriesPage() {
  useEffect(() => {
    document.title = 'Categorías | EPDE';
  }, []);

  const { data: categories, isLoading, isError, refetch } = useCategories();
  const { data: categoryTemplates } = useCategoryTemplates();
  const deleteCategory = useDeleteCategory();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryPublic | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search);
  const filtered = useMemo(() => {
    if (!categories) return [];
    if (!debouncedSearch) return categories;
    const q = debouncedSearch.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, debouncedSearch]);

  return (
    <PageTransition>
      <PageHeader
        title="Categorías"
        description="Categorías de tareas de mantenimiento"
        action={
          <Button
            onClick={() => {
              setEditingCategory(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar categoría..." />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Ícono</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Plantilla</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <ErrorState
                      message="No se pudieron cargar las categorías"
                      onRetry={refetch}
                      className="justify-center py-8"
                    />
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? (
                filtered.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.order}</TableCell>
                    <TableCell>{renderCategoryIcon(cat.icon ?? null)}</TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cat.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cat.categoryTemplateId
                        ? (categoryTemplates?.find((ct) => ct.id === cat.categoryTemplateId)
                            ?.name ?? '—')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setDialogOpen(true);
                          }}
                          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded p-2 focus-visible:ring-[3px] focus-visible:outline-none"
                          aria-label="Editar categoría"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="text-muted-foreground hover:text-destructive focus-visible:ring-ring/50 rounded p-2 focus-visible:ring-[3px] focus-visible:outline-none"
                          aria-label="Eliminar categoría"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No se encontraron categorías
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editingCategory} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar categoría"
        description="¿Estás seguro? No se puede eliminar si tiene tareas asociadas."
        onConfirm={() => {
          if (deleteId) {
            deleteCategory.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }
        }}
        isLoading={deleteCategory.isPending}
      />
    </PageTransition>
  );
}
