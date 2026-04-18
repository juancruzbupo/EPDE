'use client';

import type { CreateProfessionalInput, ProfessionalSpecialty } from '@epde/shared';
import {
  getErrorMessage,
  PROFESSIONAL_SPECIALTY_LABELS,
  PROFESSIONAL_SPECIALTY_VALUES,
} from '@epde/shared';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

type CreateProfessionalFormInput = Omit<CreateProfessionalInput, 'specialties' | 'serviceAreas'>;

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProfessional } from '@/hooks/use-professionals';

interface CreateProfessionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProfessionalDialog({ open, onOpenChange }: CreateProfessionalDialogProps) {
  const createProfessional = useCreateProfessional();
  const [specialties, setSpecialties] = useState<ProfessionalSpecialty[]>([]);
  const [primary, setPrimary] = useState<ProfessionalSpecialty | null>(null);
  const [areaInput, setAreaInput] = useState('');
  const [areas, setAreas] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProfessionalFormInput>();

  const onSubmit = (data: CreateProfessionalFormInput) => {
    if (specialties.length === 0) return;
    if (areas.length === 0) return;

    const payload: CreateProfessionalInput = {
      ...data,
      serviceAreas: areas,
      specialties: specialties.map((s) => ({
        specialty: s,
        isPrimary: s === (primary ?? specialties[0]),
      })),
    };

    createProfessional.mutate(payload, {
      onSuccess: () => {
        reset();
        setSpecialties([]);
        setPrimary(null);
        setAreas([]);
        setAreaInput('');
        onOpenChange(false);
      },
    });
  };

  const toggleSpecialty = (s: ProfessionalSpecialty) => {
    setSpecialties((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
      if (!next.includes(primary!)) setPrimary(next[0] ?? null);
      return next;
    });
  };

  const addArea = () => {
    const trimmed = areaInput.trim();
    if (!trimmed || areas.includes(trimmed)) return;
    setAreas((prev) => [...prev, trimmed]);
    setAreaInput('');
  };

  const errorMessage = createProfessional.error
    ? getErrorMessage(createProfessional.error, '')
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo profesional matriculado</DialogTitle>
          <DialogDescription>
            Datos mínimos para crearlo. El comprobante de matrícula se sube después en el detalle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
            </div>
            <div>
              <Label htmlFor="years">Años de experiencia</Label>
              <Input
                id="years"
                type="number"
                min={0}
                max={80}
                {...register('yearsOfExperience', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input id="matricula" {...register('registrationNumber')} />
              {errors.registrationNumber && (
                <p className="text-destructive text-xs">{errors.registrationNumber.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="body">Órgano registrador</Label>
              <Input id="body" placeholder="COPIME, CPIC, etc." {...register('registrationBody')} />
              {errors.registrationBody && (
                <p className="text-destructive text-xs">{errors.registrationBody.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Especialidades *</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PROFESSIONAL_SPECIALTY_VALUES.map((s) => {
                const active = specialties.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      active
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {PROFESSIONAL_SPECIALTY_LABELS[s]}
                  </button>
                );
              })}
            </div>
            {specialties.length > 1 && (
              <div className="mt-2">
                <Label className="text-xs">Primaria</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {specialties.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPrimary(s)}
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        primary === s
                          ? 'border-success bg-success/10'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {PROFESSIONAL_SPECIALTY_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {specialties.length === 0 && (
              <p className="text-muted-foreground mt-1 text-xs">
                Seleccioná al menos una especialidad
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="area">Zonas que atiende *</Label>
            <div className="flex gap-2">
              <Input
                id="area"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArea();
                  }
                }}
                placeholder="CABA Norte, Pilar, Tigre..."
              />
              <Button type="button" variant="outline" onClick={addArea}>
                Agregar
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {areas.map((a) => (
                <Badge key={a} variant="secondary" className="gap-1">
                  {a}
                  <button
                    type="button"
                    onClick={() => setAreas((prev) => prev.filter((x) => x !== a))}
                    aria-label={`Quitar ${a}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="rateMin">Tarifa mínima por hora</Label>
              <Input
                id="rateMin"
                type="number"
                min={0}
                {...register('hourlyRateMin', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="rateMax">Tarifa máxima por hora</Label>
              <Input
                id="rateMax"
                type="number"
                min={0}
                {...register('hourlyRateMax', { valueAsNumber: true })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                createProfessional.isPending || specialties.length === 0 || areas.length === 0
              }
            >
              {createProfessional.isPending ? 'Creando...' : 'Crear profesional'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
