'use client';

import type { ProfessionalTier } from '@epde/shared';
import { PROFESSIONAL_TIER_LABELS } from '@epde/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateTier } from '@/hooks/use-professionals';

export function TierDialog({
  open,
  onOpenChange,
  professionalId,
  currentTier,
  currentReason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  currentTier: ProfessionalTier;
  currentReason: string | null;
}) {
  const [tier, setTier] = useState<ProfessionalTier>(currentTier);
  const [reason, setReason] = useState(currentReason ?? '');
  const update = useUpdateTier(professionalId);

  const handleSubmit = () => {
    if (tier === 'BLOCKED' && !reason.trim()) return;
    update.mutate(
      {
        tier,
        blockedReason: tier === 'BLOCKED' ? reason.trim() : null,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar tier</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tier</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as ProfessionalTier)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROFESSIONAL_TIER_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tier === 'BLOCKED' && (
            <div>
              <Label htmlFor="reason">Razón del bloqueo *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Obligatorio: por qué no volver a contratarlo"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={update.isPending || (tier === 'BLOCKED' && !reason.trim())}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
