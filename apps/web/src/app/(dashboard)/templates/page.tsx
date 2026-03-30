'use client';

import type { CategoryTemplate, TaskTemplate } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCategoryTemplates,
  useDeleteCategoryTemplate,
  useDeleteTaskTemplate,
} from '@/hooks/use-category-templates';
import { useAuthStore } from '@/stores/auth-store';

import { CategoryTemplateDialog } from './category-template-dialog';
import { TaskTemplateDialog } from './task-template-dialog';
import { TaskTemplateTable } from './task-template-table';

export default function TemplatesPage() {
  useEffect(() => {
    document.title = 'Plantillas | EPDE';
  }, []);

  const user = useAuthStore((s) => s.user);
  const { data: categories, isLoading, isError, refetch } = useCategoryTemplates();

  if (user?.role !== UserRole.ADMIN) {
    return null;
  }
  const deleteCategory = useDeleteCategoryTemplate();
  const deleteTask = useDeleteTaskTemplate();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTemplate | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogCategoryId, setTaskDialogCategoryId] = useState('');
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEditTask = (categoryId: string, task: TaskTemplate) => {
    setTaskDialogCategoryId(categoryId);
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleAddTask = (categoryId: string) => {
    setTaskDialogCategoryId(categoryId);
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  return (
    <PageTransition>
      <PageHeader
        title="Plantillas de Tareas"
        description="Nomenclador maestro de categorías y tareas de mantenimiento"
        action={
          <Button
            onClick={() => {
              setEditingCategory(null);
              setCategoryDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="No se pudieron cargar las plantillas"
          onRetry={refetch}
          className="justify-center py-24"
        />
      ) : categories && categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((cat) => {
            const isExpanded = expandedCategories.has(cat.id);
            return (
              <Card key={cat.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleExpanded(cat.id)}
                      className="focus-visible:ring-ring/50 flex flex-1 items-center gap-2 rounded text-left focus-visible:ring-[3px] focus-visible:outline-none"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <CardTitle className="text-base">
                        {cat.icon && <span className="mr-2">{cat.icon}</span>}
                        {cat.name}
                      </CardTitle>
                      <Badge variant="secondary" className="ml-2">
                        {cat.tasks.length} tareas
                      </Badge>
                    </button>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleAddTask(cat.id)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Tarea
                      </Button>
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryDialogOpen(true);
                        }}
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                        aria-label="Editar categoría"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCategoryId(cat.id)}
                        className="text-muted-foreground hover:text-destructive focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                        aria-label="Eliminar categoría"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {cat.description && (
                    <p className="text-muted-foreground ml-6 text-sm">{cat.description}</p>
                  )}
                </CardHeader>

                {isExpanded && cat.tasks.length > 0 && (
                  <CardContent className="pt-0">
                    <TaskTemplateTable
                      tasks={cat.tasks}
                      onEdit={(task) => handleEditTask(cat.id, task)}
                      onDelete={setDeleteTaskId}
                    />
                  </CardContent>
                )}

                {isExpanded && cat.tasks.length === 0 && (
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground py-4 text-center text-sm">
                      No se encontraron tareas en esta categoría
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">No se encontraron plantillas</p>
          </CardContent>
        </Card>
      )}

      <CategoryTemplateDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
      />

      <TaskTemplateDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        categoryId={taskDialogCategoryId}
        task={editingTask}
      />

      <ConfirmDialog
        open={!!deleteCategoryId}
        onOpenChange={() => setDeleteCategoryId(null)}
        title="Eliminar categoría template"
        description="¿Estás seguro? Esto eliminará la categoría y todas sus tareas template."
        onConfirm={() => {
          if (deleteCategoryId) {
            deleteCategory.mutate(deleteCategoryId, { onSuccess: () => setDeleteCategoryId(null) });
          }
        }}
        isLoading={deleteCategory.isPending}
      />

      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={() => setDeleteTaskId(null)}
        title="Eliminar tarea template"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirm={() => {
          if (deleteTaskId) {
            deleteTask.mutate(deleteTaskId, { onSuccess: () => setDeleteTaskId(null) });
          }
        }}
        isLoading={deleteTask.isPending}
      />
    </PageTransition>
  );
}
