'use client';

import { PROPERTY_SECTOR_LABELS, type PropertySector, TaskPriority } from '@epde/shared';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import React, { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TaskPublic } from '@/lib/api/maintenance-plans';

interface PlanValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskPublic[];
  activeSectors?: string[];
  onConfirm: () => void;
  isLoading: boolean;
}

interface Warning {
  message: string;
  severity: 'warning' | 'error';
}

function validatePlan(tasks: TaskPublic[], activeSectors?: string[]): Warning[] {
  const warnings: Warning[] = [];

  if (tasks.length === 0) {
    warnings.push({ message: 'El plan no tiene tareas.', severity: 'error' });
    return warnings;
  }

  // Sectors without tasks
  if (activeSectors && activeSectors.length > 0) {
    const taskSectors = new Set<string>(tasks.map((t) => t.sector).filter(Boolean) as string[]);
    const uncovered = activeSectors.filter((s) => !taskSectors.has(s));
    if (uncovered.length > 0) {
      const names = uncovered
        .map((s) => PROPERTY_SECTOR_LABELS[s as PropertySector] ?? s)
        .join(', ');
      warnings.push({
        message: `Sectores sin tareas: ${names}`,
        severity: 'warning',
      });
    }
  }

  // Urgent tasks without near due date
  const now = Date.now();
  const sevenDays = 7 * 86_400_000;
  const urgentWithoutDate = tasks.filter(
    (t) =>
      t.priority === TaskPriority.URGENT &&
      (!t.nextDueDate || new Date(t.nextDueDate).getTime() - now > sevenDays),
  );
  if (urgentWithoutDate.length > 0) {
    warnings.push({
      message: `${urgentWithoutDate.length} tarea${urgentWithoutDate.length > 1 ? 's' : ''} urgente${urgentWithoutDate.length > 1 ? 's' : ''} sin fecha dentro de los próximos 7 días.`,
      severity: 'warning',
    });
  }

  // Date clustering — more than 5 tasks in same month
  const monthCounts = new Map<string, number>();
  for (const t of tasks) {
    if (!t.nextDueDate) continue;
    const d = new Date(t.nextDueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  for (const [, count] of monthCounts) {
    if (count > 5) {
      warnings.push({
        message: `Hay meses con más de 5 tareas. Distribuí las fechas para no sobrecargar al cliente.`,
        severity: 'warning',
      });
      break;
    }
  }

  // Tasks without sector
  const noSector = tasks.filter((t) => !t.sector);
  if (noSector.length > 0) {
    warnings.push({
      message: `${noSector.length} tarea${noSector.length > 1 ? 's' : ''} sin sector asignado.`,
      severity: 'warning',
    });
  }

  return warnings;
}

export const PlanValidationDialog = React.memo(function PlanValidationDialog({
  open,
  onOpenChange,
  tasks,
  activeSectors,
  onConfirm,
  isLoading,
}: PlanValidationDialogProps) {
  const warnings = useMemo(() => validatePlan(tasks, activeSectors), [tasks, activeSectors]);
  const hasErrors = warnings.some((w) => w.severity === 'error');
  const allClear = warnings.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activar plan de mantenimiento</DialogTitle>
          <DialogDescription>
            {allClear
              ? 'Todo listo. ¿Querés activar el plan?'
              : 'Revisá estos puntos antes de activar.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {allClear && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <CheckCircle className="text-success h-5 w-5 shrink-0" />
              <p className="text-sm">El plan está completo y listo para activarse.</p>
            </div>
          )}
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
              <AlertTriangle
                className={`h-5 w-5 shrink-0 ${w.severity === 'error' ? 'text-destructive' : 'text-warning'}`}
              />
              <p className="text-sm">{w.message}</p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Revisar plan
          </Button>
          <Button onClick={onConfirm} disabled={hasErrors || isLoading}>
            {isLoading ? 'Activando...' : 'Activar de todas formas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
