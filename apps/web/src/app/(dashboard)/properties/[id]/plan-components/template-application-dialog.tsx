import React from 'react';

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
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onApply: () => void;
  isApplying: boolean;
}

export const TemplateApplicationDialog = React.memo(function TemplateApplicationDialog({
  open,
  onOpenChange,
  categoryTemplates,
  selectedTemplateId,
  onSelectTemplate,
  onApply,
  isApplying,
}: TemplateApplicationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar template de categoría</DialogTitle>
          <DialogDescription>
            Seleccioná un template para agregar todas sus tareas al plan de una vez.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          {categoryTemplates?.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.id)}
              className={cn(
                'flex items-center justify-between rounded-lg border p-3 text-left transition-colors',
                selectedTemplateId === tpl.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
              )}
            >
              <div>
                <p className="text-sm font-medium">{tpl.name}</p>
                {tpl.description && (
                  <p className="text-muted-foreground text-xs">{tpl.description}</p>
                )}
              </div>
              <span className="text-muted-foreground text-xs">
                {tpl.tasks.length} tarea{tpl.tasks.length !== 1 ? 's' : ''}
              </span>
            </button>
          ))}
          {categoryTemplates?.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No hay templates disponibles.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!selectedTemplateId || isApplying} onClick={onApply}>
            {isApplying ? 'Aplicando...' : 'Aplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
