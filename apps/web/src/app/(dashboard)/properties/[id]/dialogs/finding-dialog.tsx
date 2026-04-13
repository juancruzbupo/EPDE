'use client';

import type { InspectionItemStatus } from '@epde/shared';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface FindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  status: InspectionItemStatus | null;
  isSaving: boolean;
  onSave: (itemId: string, status: InspectionItemStatus, finding: string) => void;
}

/**
 * Captures a short finding description when the inspector marks an item as
 * NEEDS_ATTENTION or NEEDS_PROFESSIONAL. Purely a controlled dialog — parent
 * owns the target item/status and the mutation.
 */
export function FindingDialog({
  open,
  onOpenChange,
  itemId,
  status,
  isSaving,
  onSave,
}: FindingDialogProps) {
  const [findingText, setFindingText] = useState('');

  // Reset the textarea each time the dialog opens for a new item.
  useEffect(() => {
    if (open) setFindingText('');
  }, [open, itemId]);

  const handleSave = () => {
    if (!itemId || !status) return;
    onSave(itemId, status, findingText);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Qué encontraste?</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-xs">
          Describí brevemente qué observaste. Ej: &quot;Pintura descascarada en esquina NE&quot;,
          &quot;Fisura de 2mm en muro sur&quot;, &quot;Flexible de gas vencido&quot;.
        </p>
        <Textarea
          value={findingText}
          onChange={(e) => setFindingText(e.target.value)}
          placeholder="Describí el hallazgo..."
          rows={3}
          className="resize-none"
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={isSaving} onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
