'use client';

import type { ProfessionalAvailability } from '@epde/shared';
import { PROFESSIONAL_AVAILABILITY_LABELS } from '@epde/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateAvailability } from '@/hooks/use-professionals';

export function AvailabilityDialog({
  open,
  onOpenChange,
  professionalId,
  currentAvailability,
  currentUntil,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  currentAvailability: ProfessionalAvailability;
  currentUntil: string | null;
}) {
  const [availability, setAvailability] = useState<ProfessionalAvailability>(currentAvailability);
  const [until, setUntil] = useState(currentUntil ? currentUntil.slice(0, 10) : '');
  const update = useUpdateAvailability(professionalId);

  const handleSubmit = () => {
    update.mutate(
      {
        availability,
        availableUntil: until ? new Date(until).toISOString() : null,
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
          <DialogTitle>Cambiar disponibilidad</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Estado</Label>
            <Select
              value={availability}
              onValueChange={(v) => setAvailability(v as ProfessionalAvailability)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROFESSIONAL_AVAILABILITY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {availability === 'BUSY' && (
            <div>
              <Label htmlFor="until">Ocupado hasta (opcional)</Label>
              <Input
                id="until"
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={update.isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
