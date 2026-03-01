'use client';

import { useState } from 'react';
import {
  useCategoryTemplates,
  useDeleteCategoryTemplate,
  useDeleteTaskTemplate,
} from '@/hooks/use-category-templates';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import {
  TASK_TYPE_LABELS,
  PROFESSIONAL_REQUIREMENT_LABELS,
  TASK_PRIORITY_LABELS,
  RECURRENCE_TYPE_LABELS,
} from '@epde/shared';
import { priorityColors, taskTypeColors, professionalReqColors } from '@/lib/style-maps';
import { CategoryTemplateDialog } from './category-template-dialog';
import { TaskTemplateDialog } from './task-template-dialog';
import type { CategoryTemplate, TaskTemplate } from '@epde/shared';

export default function TemplatesPage() {
  const { data: categories, isLoading } = useCategoryTemplates();
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTaskDialogCategoryId(cat.id);
                          setEditingTask(null);
                          setTaskDialogOpen(true);
                        }}
                      >
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Profesional</TableHead>
                          <TableHead>Prioridad</TableHead>
                          <TableHead>Recurrencia</TableHead>
                          <TableHead className="w-20">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cat.tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="text-muted-foreground text-xs">
                              {task.displayOrder}
                            </TableCell>
                            <TableCell className="font-medium">{task.name}</TableCell>
                            <TableCell>
                              <span
                                className={`rounded px-1.5 py-0.5 text-xs ${taskTypeColors[task.taskType] ?? ''}`}
                              >
                                {TASK_TYPE_LABELS[task.taskType] ?? task.taskType}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`rounded px-1.5 py-0.5 text-xs ${professionalReqColors[task.professionalRequirement] ?? ''}`}
                              >
                                {PROFESSIONAL_REQUIREMENT_LABELS[task.professionalRequirement] ??
                                  task.professionalRequirement}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`rounded px-1.5 py-0.5 text-xs ${priorityColors[task.priority] ?? ''}`}
                              >
                                {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setTaskDialogCategoryId(cat.id);
                                    setEditingTask(task);
                                    setTaskDialogOpen(true);
                                  }}
                                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                                  aria-label="Editar tarea"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTaskId(task.id)}
                                  className="text-muted-foreground hover:text-destructive focus-visible:ring-ring/50 rounded p-1 focus-visible:ring-[3px] focus-visible:outline-none"
                                  aria-label="Eliminar tarea"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
