'use client';

import type { DetectedProblem, PropertyHealthIndex } from '@epde/shared';
import { CONDITION_FOUND_LABELS, type ConditionFound } from '@epde/shared';
import { AlertTriangle, ArrowRight, Heart, Info, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { HealthIndexCard } from '@/components/health-index-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

/**
 * Picks the single most important signal to surface at the top of the Health
 * tab so first-time users (especially less tech-savvy owners) know where to
 * look first instead of parsing 11+ cards in parallel. Returns null when
 * everything is fine — in which case we celebrate with a lighter-weight card.
 */
function getPriorityHint(
  healthIndex: PropertyHealthIndex,
  problems: DetectedProblem[] | undefined,
): { tone: 'critical' | 'warning' | 'ok'; title: string; message: string } | null {
  const criticalProblems = (problems ?? []).filter((p) => p.severity === 'high');
  if (criticalProblems.length > 0) {
    return {
      tone: 'critical',
      title: `Tenés ${criticalProblems.length} problema${criticalProblems.length === 1 ? '' : 's'} que requiere${criticalProblems.length === 1 ? '' : 'n'} atención`,
      message:
        'Revisá la sección "Esto puede generarte gastos si no lo resolvés" — son cosas que si no atendés ahora, escalan a reparaciones más caras.',
    };
  }
  if (healthIndex.score < 40) {
    return {
      tone: 'critical',
      title: `Tu ISV es ${healthIndex.score} — atención necesaria`,
      message:
        'Las reparaciones futuras van a salir más caras si no empezás a resolver tareas pendientes. Revisá las recomendaciones abajo.',
    };
  }
  if (healthIndex.score < 60) {
    return {
      tone: 'warning',
      title: `Tu ISV es ${healthIndex.score} — hay margen de mejora`,
      message:
        'Mantenerlo arriba de 60 evita reparaciones costosas. Mirá la dimensión más baja abajo y empezá por ahí.',
    };
  }
  return {
    tone: 'ok',
    title: `Tu vivienda está bien cuidada (ISV ${healthIndex.score})`,
    message:
      'Seguí con el plan de mantenimiento cuando aparezcan tareas nuevas. No hay nada urgente hoy.',
  };
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

  const priorityHint = getPriorityHint(healthIndex, problems);

  return (
    <div className="space-y-6">
      <Alert variant="default" className="border-primary/30 bg-primary/5">
        <Info aria-hidden="true" />
        <AlertTitle>¿Qué estás viendo acá?</AlertTitle>
        <AlertDescription>
          El <strong>ISV (Índice de Salud de la Vivienda)</strong> es un número de 0 a 100 que
          resume cuánto cuidado necesita tu casa. Arriba de 60 = está bien mantenida; abajo de 40 =
          las reparaciones futuras van a salir más caras. Se calcula con 5 dimensiones: si estás al
          día con las tareas, en qué condición están las cosas, cuánto revisamos, si prevenís o
          reparás, y si mejora o empeora con el tiempo.
        </AlertDescription>
      </Alert>

      {priorityHint && (
        <Card
          className={
            priorityHint.tone === 'critical'
              ? 'border-destructive/40 bg-destructive/5'
              : priorityHint.tone === 'warning'
                ? 'border-warning/40 bg-warning/5'
                : 'border-success/40 bg-success/5'
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {priorityHint.tone === 'critical' && (
                <AlertTriangle className="text-destructive h-4 w-4" aria-hidden="true" />
              )}
              {priorityHint.tone === 'warning' && (
                <ArrowRight className="text-warning h-4 w-4" aria-hidden="true" />
              )}
              {priorityHint.tone === 'ok' && (
                <Sparkles className="text-success h-4 w-4" aria-hidden="true" />
              )}
              {priorityHint.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="type-body-sm text-muted-foreground">{priorityHint.message}</p>
          </CardContent>
        </Card>
      )}

      <HealthIndexCard index={healthIndex} history={history} address={address} />

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
                className="border-border hover:border-primary/30 cursor-pointer rounded-lg border p-3 transition-colors"
                onClick={() => onNavigateToTask?.(problem.taskId)}
                onKeyDown={(e) => e.key === 'Enter' && onNavigateToTask?.(problem.taskId)}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="type-body-md text-foreground font-medium">
                        {problem.taskName}
                      </span>
                      <Badge variant={problem.severity === 'high' ? 'destructive' : 'warning'}>
                        {CONDITION_FOUND_LABELS[problem.conditionFound as ConditionFound] ??
                          problem.conditionFound}
                      </Badge>
                    </div>
                    <p className="type-body-sm text-muted-foreground">
                      {getImpactMessage(problem.sector, problem.severity)}
                    </p>
                    {problem.severity === 'high' && (
                      <p className="type-body-sm text-destructive font-medium">
                        Recomendado resolver cuanto antes
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto sm:shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setServiceDialogProblem(problem);
                    }}
                  >
                    Solicitar servicio
                  </Button>
                </div>
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
