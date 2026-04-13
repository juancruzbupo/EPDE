'use client';

import { UserRole } from '@epde/shared';
import type { LucideIcon } from 'lucide-react';
import {
  Armchair,
  Bug,
  Building,
  CloudLightning,
  Cylinder,
  DoorOpen,
  Droplet,
  Droplets,
  FileText,
  FireExtinguisher,
  Flame,
  Footprints,
  Home,
  Layers,
  Paintbrush,
  Pencil,
  Plus,
  SquareStack,
  Sun,
  Thermometer,
  Trash2,
  Trees,
  Waves,
  Wifi,
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
  armchair: Armchair,
  cylinder: Cylinder,
  waves: Waves,
  sun: Sun,
  wifi: Wifi,
  'square-stack': SquareStack,
  'cloud-lightning': CloudLightning,
  stairs: Footprints,
  'file-text': FileText,
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
import { useAuthStore } from '@/stores/auth-store';

import { CategoryDialog } from './category-dialog';

function CategoryMobileCard({
  category,
  templateName,
  onEdit,
  onDelete,
}: {
  category: CategoryPublic;
  templateName: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-card hover:bg-muted/40 w-full rounded-lg border p-3 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0">
              {renderCategoryIcon(category.icon ?? null)}
            </span>
            <p className="text-sm font-medium">{category.name}</p>
          </div>
          {category.description && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
              {category.description}
            </p>
          )}
          {templateName && (
            <p className="text-muted-foreground mt-1 text-xs">Plantilla: {templateName}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded p-2 focus-visible:ring-[3px] focus-visible:outline-none"
            aria-label="Editar categoría"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive focus-visible:ring-ring/50 rounded p-2 focus-visible:ring-[3px] focus-visible:outline-none"
            aria-label="Eliminar categoría"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  useEffect(() => {
    document.title = 'Categorías | EPDE';
  }, []);

  const user = useAuthStore((s) => s.user);
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

  if (user?.role !== UserRole.ADMIN) {
    return null;
  }

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
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nueva Categoría</span>
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar categoría..." />
      </div>

      {/* Mobile: cards — Desktop: table */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card h-20 animate-pulse rounded-lg border" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            message="No se pudieron cargar las categorías"
            onRetry={refetch}
            className="justify-center py-12"
          />
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No se encontraron categorías
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((cat) => (
              <CategoryMobileCard
                key={cat.id}
                category={cat}
                templateName={
                  cat.categoryTemplateId
                    ? (categoryTemplates?.find((ct) => ct.id === cat.categoryTemplateId)?.name ??
                      null)
                    : null
                }
                onEdit={() => {
                  setEditingCategory(cat);
                  setDialogOpen(true);
                }}
                onDelete={() => setDeleteId(cat.id)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="hidden sm:block">
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
      </div>

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
