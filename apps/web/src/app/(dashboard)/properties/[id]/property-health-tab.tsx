'use client';

import type { DetectedProblem } from '@epde/shared';
import { CONDITION_FOUND_LABELS, type ConditionFound } from '@epde/shared';
import { AlertTriangle, Heart } from 'lucide-react';
import { useState } from 'react';

import { HealthIndexCard } from '@/components/health-index-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  usePropertyHealthHistory,
  usePropertyHealthIndex,
  usePropertyProblems,
} from '@/hooks/use-properties';

import { CreateServiceDialog } from '../../service-requests/create-service-dialog';

function getImpactMessage(sector: string | null, severity: 'high' | 'medium' = 'medium'): string {
  const critical = severity === 'high';
  switch (sector) {
    case 'ROOF':
      return critical
        ? 'Puede generar filtraciones activas y dañar interiores. Resolverlo ahora evita reparaciones mucho más costosas.'
        : 'Puede convertirse en filtraciones con el tiempo. Conviene resolverlo antes de que avance.';
    case 'BATHROOM':
    case 'KITCHEN':
      return critical
        ? 'Puede provocar humedad constante y filtraciones a otros ambientes.'
        : 'Puede generar humedad y desgaste progresivo. Atenderlo a tiempo evita reparaciones más complejas.';
    case 'INSTALLATIONS':
      return critical
        ? 'Puede comprometer la seguridad de la instalación. Es recomendable resolverlo cuanto antes.'
        : 'Puede afectar el funcionamiento y volverse un problema más serio con el tiempo.';
    case 'BASEMENT':
      return critical
        ? 'Puede afectar la estabilidad de la estructura. Resolverlo evita intervenciones más complejas.'
        : 'Puede evolucionar y generar daños estructurales si no se controla.';
    case 'EXTERIOR':
    case 'GARDEN':
    case 'TERRACE':
      return critical
        ? 'Puede afectar drenajes y generar acumulación de agua. Resolverlo evita problemas mayores.'
        : 'Puede empeorar con el clima y generar desgaste progresivo.';
    case 'INTERIOR':
      return critical
        ? 'Puede expandirse y afectar otros ambientes. Resolverlo ahora evita daños mayores.'
        : 'Puede deteriorarse progresivamente. Conviene corregirlo antes de que empeore.';
    default:
      return critical
        ? 'Puede empeorar rápidamente y generar daños mayores. Resolverlo ahora evita costos más altos.'
        : 'Puede evolucionar con el tiempo y volverse más costoso de reparar.';
  }
}

export function PropertyHealthTab({
  propertyId,
  address,
  onNavigateToTask,
}: {
  propertyId: string;
  address: string;
  onNavigateToTask?: (taskId: string) => void;
}) {
  const { data: healthIndex, isLoading } = usePropertyHealthIndex(propertyId);
  const { data: history } = usePropertyHealthHistory(propertyId);
  const { data: problems } = usePropertyProblems(propertyId);
  const [serviceDialogProblem, setServiceDialogProblem] = useState<DetectedProblem | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-muted/40 h-8 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthIndex || healthIndex.score === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <Heart className="text-muted-foreground/60 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            No hay datos suficientes para calcular el índice de salud.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div data-tour="property-health">
        <HealthIndexCard index={healthIndex} history={history} address={address} />
      </div>

      {/* Detected problems */}
      {problems && problems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-4 w-4" />
              <CardTitle className="text-base">
                Esto puede generarte gastos si no lo resolvés
                <Badge variant="destructive" className="ml-2">
                  {problems.length}
                </Badge>
              </CardTitle>
            </div>
            <p className="type-body-sm text-muted-foreground mt-1">
              Detectamos problemas que pueden empeorar con el tiempo. Basado en observaciones
              visuales — se recomienda evaluación por un especialista en el área afectada.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {problems.map((problem) => (
              <div
                key={problem.taskId}
                role="button"
                tabIndex={0}
                className="border-border hover:border-primary/30 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                onClick={() => onNavigateToTask?.(problem.taskId)}
                onKeyDown={(e) => e.key === 'Enter' && onNavigateToTask?.(problem.taskId)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="type-body-md text-foreground truncate font-medium">
                      {problem.taskName}
                    </span>
                    <Badge variant={problem.severity === 'high' ? 'destructive' : 'warning'}>
                      {CONDITION_FOUND_LABELS[problem.conditionFound as ConditionFound] ??
                        problem.conditionFound}
                    </Badge>
                  </div>
                  <span className="type-body-sm text-muted-foreground">
                    {getImpactMessage(problem.sector, problem.severity)}
                  </span>
                  {problem.severity === 'high' && (
                    <p className="type-body-sm text-destructive mt-0.5 font-medium">
                      Recomendado resolver cuanto antes
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setServiceDialogProblem(problem);
                  }}
                >
                  Solicitar servicio
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Service request dialog triggered from problem */}
      {serviceDialogProblem && (
        <CreateServiceDialog
          open={!!serviceDialogProblem}
          onOpenChange={(open) => !open && setServiceDialogProblem(null)}
          defaultPropertyId={propertyId}
          defaultTaskId={serviceDialogProblem.taskId}
          defaultTitle={`Problema: ${serviceDialogProblem.taskName}`}
          defaultDescription={
            serviceDialogProblem.notes ??
            `Condición: ${CONDITION_FOUND_LABELS[serviceDialogProblem.conditionFound as ConditionFound] ?? serviceDialogProblem.conditionFound}`
          }
        />
      )}
    </div>
  );
}
