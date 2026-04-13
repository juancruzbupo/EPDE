'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PlanGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskCount: number;
  isGenerating: boolean;
  onGenerate: (planName: string) => void;
}

/**
 * Prompts the user for a plan name before generating the MaintenancePlan
 * from the completed inspection. Parent owns the mutation.
 */
export function PlanGenerationDialog({
  open,
  onOpenChange,
  taskCount,
  isGenerating,
  onGenerate,
}: PlanGenerationDialogProps) {
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    if (open) setPlanName('');
  }, [open]);

  const canGenerate = planName.trim().length > 0 && !isGenerating;

  const handleGenerate = () => {
    if (!canGenerate) return;
    onGenerate(planName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar plan de mantenimiento</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Se va a crear un plan con {taskCount} tareas de mantenimiento basadas en lo que
          encontraste en la inspección. Las tareas marcadas como &quot;necesita atención&quot; o
          &quot;requiere profesional&quot; tendrán mayor prioridad.
        </p>
        <Input
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="Nombre del plan..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canGenerate) handleGenerate();
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={!canGenerate}>
            Generar plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
