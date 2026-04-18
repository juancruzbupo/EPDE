'use client';

import type { ProfessionalSpecialty, ServiceStatus } from '@epde/shared';
import { PROFESSIONAL_SPECIALTY_LABELS, PROFESSIONAL_SPECIALTY_VALUES } from '@epde/shared';
import { HardHat, Loader2, Star, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  useAssignProfessional,
  useSuggestedProfessionals,
  useUnassignProfessional,
} from '@/hooks/use-professionals';
import { ROUTES } from '@/lib/routes';

/** Accepts either the flat ServiceRequestAssignmentBrief shape or the raw
 * Prisma include shape. Normalized internally so callers don't have to map. */
type RawAssignmentInclude = {
  professionalId: string;
  assignedAt: string;
  professional: {
    name: string;
    specialties: { specialty: ProfessionalSpecialty }[];
  };
};

type FlatAssignment = {
  professionalId: string;
  professionalName: string;
  professionalSpecialty: ProfessionalSpecialty | null;
  assignedAt: string;
};

type AssignmentShape = FlatAssignment | RawAssignmentInclude;

interface AssignProfessionalCardProps {
  serviceRequestId: string;
  status: ServiceStatus;
  assignment: AssignmentShape | null;
}

function normalizeAssignment(a: AssignmentShape): FlatAssignment {
  if ('professional' in a) {
    return {
      professionalId: a.professionalId,
      professionalName: a.professional.name,
      professionalSpecialty: a.professional.specialties[0]?.specialty ?? null,
      assignedAt: a.assignedAt,
    };
  }
  return a;
}

export function AssignProfessionalCard({
  serviceRequestId,
  status,
  assignment: rawAssignment,
}: AssignProfessionalCardProps) {
  const assignment = rawAssignment ? normalizeAssignment(rawAssignment) : null;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [specialty, setSpecialty] = useState<ProfessionalSpecialty>('ELECTRICIAN');

  const assign = useAssignProfessional();
  const unassign = useUnassignProfessional();
  const suggested = useSuggestedProfessionals({
    specialty,
    limit: 3,
    enabled: dialogOpen,
  });

  const isClosed = status === 'CLOSED';

  if (assignment) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <HardHat className="h-3.5 w-3.5" />
                Profesional asignado
              </div>
              <Link
                href={ROUTES.professional(assignment.professionalId)}
                className="mt-1 block font-medium hover:underline"
              >
                {assignment.professionalName}
              </Link>
              {assignment.professionalSpecialty && (
                <p className="text-muted-foreground text-xs">
                  {PROFESSIONAL_SPECIALTY_LABELS[assignment.professionalSpecialty]}
                </p>
              )}
              <p className="text-muted-foreground mt-1 text-xs">
                Asignado el {new Date(assignment.assignedAt).toLocaleDateString('es-AR')}
              </p>
            </div>
            {!isClosed && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => unassign.mutate(serviceRequestId)}
                disabled={unassign.isPending}
                aria-label="Quitar asignación"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isClosed) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <HardHat className="h-3.5 w-3.5" />
              Profesional
            </div>
            <p className="mt-0.5 text-sm">Sin asignar todavía</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            Asignar
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Asignar profesional</DialogTitle>
              <DialogDescription>
                Elegí la especialidad y asigná uno de los sugeridos o buscá manualmente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Especialidad requerida</Label>
                <Select
                  value={specialty}
                  onValueChange={(v) => setSpecialty(v as ProfessionalSpecialty)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONAL_SPECIALTY_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PROFESSIONAL_SPECIALTY_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                  Sugeridos (top 3)
                </p>
                {suggested.isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                  </div>
                ) : !suggested.data || suggested.data.length === 0 ? (
                  <p className="text-muted-foreground py-2 text-center text-sm">
                    No hay profesionales disponibles para esta especialidad.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {suggested.data.map(({ professional: p, matchReason }) => (
                      <div
                        key={p.id}
                        className="border-border flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <Badge
                              variant={
                                p.tier === 'A'
                                  ? 'success'
                                  : p.tier === 'B'
                                    ? 'secondary'
                                    : 'warning'
                              }
                              className="text-xs"
                            >
                              {p.tier}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground truncate text-xs">{matchReason}</p>
                          {p.stats.ratingAvg !== null && (
                            <p className="text-muted-foreground flex items-center gap-1 text-xs">
                              <Star className="text-warning h-3 w-3 fill-current" />
                              {p.stats.ratingAvg.toFixed(1)} ({p.stats.ratingCount})
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            assign.mutate(
                              { serviceRequestId, professionalId: p.id },
                              { onSuccess: () => setDialogOpen(false) },
                            )
                          }
                          disabled={assign.isPending}
                        >
                          Asignar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-border border-t pt-3 text-center">
                <Link
                  href={ROUTES.professionals}
                  className="text-muted-foreground text-xs hover:underline"
                >
                  Ver todos los profesionales →
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
