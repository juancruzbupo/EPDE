import React, { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CategoryTemplate {
  id: string;
  name: string;
  description: string | null;
  tasks: unknown[];
}

interface TemplateApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryTemplates: CategoryTemplate[] | undefined;
  onApply: (templateIds: string[]) => void;
  isApplying: boolean;
}

export const TemplateApplicationDialog = React.memo(function TemplateApplicationDialog({
  open,
  onOpenChange,
  categoryTemplates,
  onApply,
  isApplying,
}: TemplateApplicationDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!categoryTemplates) return;
    setSelected((prev) =>
      prev.size === categoryTemplates.length
        ? new Set()
        : new Set(categoryTemplates.map((t) => t.id)),
    );
  }, [categoryTemplates]);

  const totalTasks =
    categoryTemplates
      ?.filter((t) => selected.has(t.id))
      .reduce((sum, t) => sum + t.tasks.length, 0) ?? 0;

  const handleApply = () => {
    if (selected.size === 0) return;
    onApply([...selected]);
    setSelected(new Set());
  };

  const handleClose = (value: boolean) => {
    if (!value) setSelected(new Set());
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar templates</DialogTitle>
          <DialogDescription>
            Seleccioná uno o más templates para agregar sus tareas al plan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 py-2">
          {categoryTemplates && categoryTemplates.length > 1 && (
            <button
              type="button"
              onClick={selectAll}
              className="text-primary mb-2 text-xs font-medium hover:underline"
            >
              {selected.size === categoryTemplates.length
                ? 'Deseleccionar todos'
                : 'Seleccionar todos'}
            </button>
          )}
          {categoryTemplates?.map((tpl) => (
            <label
              key={tpl.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                selected.has(tpl.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
              )}
            >
              <input
                type="checkbox"
                checked={selected.has(tpl.id)}
                onChange={() => toggle(tpl.id)}
                className="accent-primary h-4 w-4 rounded"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{tpl.name}</p>
                {tpl.description && (
                  <p className="text-muted-foreground text-xs">{tpl.description}</p>
                )}
              </div>
              <span className="text-muted-foreground shrink-0 text-xs">
                {tpl.tasks.length} tarea{tpl.tasks.length !== 1 ? 's' : ''}
              </span>
            </label>
          ))}
          {categoryTemplates?.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No hay templates disponibles.
            </p>
          )}
        </div>
        {selected.size > 0 && (
          <p className="text-muted-foreground text-xs">
            {selected.size} template{selected.size !== 1 ? 's' : ''} seleccionado
            {selected.size !== 1 ? 's' : ''} — {totalTasks} tarea{totalTasks !== 1 ? 's' : ''} en
            total
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button disabled={selected.size === 0 || isApplying} onClick={handleApply}>
            {isApplying
              ? 'Aplicando...'
              : `Aplicar ${selected.size > 0 ? `(${totalTasks} tareas)` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
