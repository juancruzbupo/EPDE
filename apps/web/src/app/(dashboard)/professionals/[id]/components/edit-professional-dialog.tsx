'use client';

import type { ProfessionalDetailPublic, UpdateProfessionalInput } from '@epde/shared';
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
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProfessional } from '@/hooks/use-professionals';

export function EditProfessionalDialog({
  open,
  onOpenChange,
  professional,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: ProfessionalDetailPublic;
}) {
  const [name, setName] = useState(professional.name);
  const [email, setEmail] = useState(professional.email);
  const [phone, setPhone] = useState(professional.phone);
  const [bio, setBio] = useState(professional.bio ?? '');
  const [years, setYears] = useState(professional.yearsOfExperience?.toString() ?? '');
  const [rateMin, setRateMin] = useState(professional.hourlyRateMin?.toString() ?? '');
  const [rateMax, setRateMax] = useState(professional.hourlyRateMax?.toString() ?? '');
  const [notes, setNotes] = useState(professional.notes ?? '');

  const update = useUpdateProfessional(professional.id);

  const handleSubmit = () => {
    const payload: UpdateProfessionalInput = {
      name,
      email,
      phone,
      bio: bio || null,
      yearsOfExperience: years ? Number(years) : null,
      hourlyRateMin: rateMin ? Number(rateMin) : null,
      hourlyRateMax: rateMax ? Number(rateMax) : null,
      notes: notes || null,
    };
    update.mutate(payload, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar profesional</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="edit-name">Nombre</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-years">Años de experiencia</Label>
              <Input
                id="edit-years"
                type="number"
                min={0}
                max={80}
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-rateMin">Tarifa mínima</Label>
              <Input
                id="edit-rateMin"
                type="number"
                min={0}
                value={rateMin}
                onChange={(e) => setRateMin(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-rateMax">Tarifa máxima</Label>
              <Input
                id="edit-rateMax"
                type="number"
                min={0}
                value={rateMax}
                onChange={(e) => setRateMax(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
              rows={2}
              maxLength={1000}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-notes">Notas internas</Label>
            <Textarea
              id="edit-notes"
              rows={2}
              maxLength={4000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
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
