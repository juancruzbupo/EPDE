import type {
  ConditionFound,
  DetectedProblem,
  ISVSnapshotPublic,
  PropertyHealthIndex,
} from '@epde/shared';
import { CONDITION_FOUND_LABELS } from '@epde/shared';
import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { getMobileImpactMessage } from '@/lib/impact-message';

/* ── Score color helper ── */
function scoreColorClass(value: number): string {
  if (value >= 80) return 'text-success';
  if (value >= 60) return 'text-primary';
  if (value >= 40) return 'text-warning';
  if (value >= 20) return 'text-caution';
  return 'text-destructive';
}

function scoreBgClass(value: number): string {
  if (value >= 80) return 'bg-success';
  if (value >= 60) return 'bg-primary';
  if (value >= 40) return 'bg-warning';
  if (value >= 20) return 'bg-caution';
  return 'bg-destructive';
}

/* ── Dimensions config ── */
const DIMENSIONS = [
  {
    key: 'compliance' as const,
    name: '\u00bfEst\u00e1s al d\u00eda?',
    hint: 'Tareas completadas a tiempo',
  },
  {
    key: 'condition' as const,
    name: '\u00bfEn qu\u00e9 estado est\u00e1?',
    hint: 'Condici\u00f3n en \u00faltimas inspecciones',
  },
  {
    key: 'coverage' as const,
    name: '\u00bfCu\u00e1nto revisamos?',
    hint: 'Sectores inspeccionados',
  },
  {
    key: 'investment' as const,
    name: '\u00bfPreven\u00eds o repar\u00e1s?',
    hint: 'Prevenci\u00f3n vs reparaciones',
  },
  {
    key: 'trend' as const,
    name: '\u00bfMejora o empeora?',
    hint: 'Comparaci\u00f3n con trimestre anterior',
  },
] as const;

/* ── Health Section ── */
interface PropertyHealthSectionProps {
  healthIndex: PropertyHealthIndex;
  healthHistory: ISVSnapshotPublic[] | undefined;
  propertyId: string;
}

export const PropertyHealthSection = React.memo(function PropertyHealthSection({
  healthIndex,
  healthHistory,
  propertyId,
}: PropertyHealthSectionProps) {
  return (
    <CollapsibleSection title={`Salud (ISV: ${healthIndex.score}/100)`} defaultOpen>
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text style={TYPE.numberLg} className={scoreColorClass(healthIndex.score)}>
            {healthIndex.score}
          </Text>
          <View className="items-end">
            <Text style={TYPE.titleSm} className="text-foreground">
              {healthIndex.label}
            </Text>
            <Text style={TYPE.bodySm} className="text-muted-foreground">
              {healthIndex.dimensions.trend > 55
                ? 'Mejorando'
                : healthIndex.dimensions.trend < 45
                  ? 'Declinando'
                  : 'Estable'}
            </Text>
          </View>
        </View>
        {DIMENSIONS.map(({ key, name, hint }) => {
          const value = healthIndex.dimensions[key];
          return (
            <View key={key}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text style={TYPE.bodySm} className="text-foreground">
                    {name}
                  </Text>
                  <Text style={TYPE.labelSm} className="text-muted-foreground">
                    {hint}
                  </Text>
                </View>
                <Text style={TYPE.bodySm} className={`${scoreColorClass(value)} font-semibold`}>
                  {value}
                </Text>
              </View>
              <View className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                <View
                  className={`h-full rounded-full ${scoreBgClass(value)}`}
                  style={{ width: `${value}%` }}
                />
              </View>
            </View>
          );
        })}
        {healthHistory && healthHistory.length > 1 && (
          <View className="border-border border-t pt-2">
            <Text style={TYPE.labelMd} className="text-muted-foreground mb-2">
              Evoluci\u00f3n
            </Text>
            <View className="flex-row items-end gap-1" style={{ height: 60 }}>
              {healthHistory.map((s) => {
                const h = Math.max(4, (s.score / 100) * 52);
                return (
                  <View key={s.month} className="flex-1 items-center">
                    <View
                      className={`w-full rounded-t ${scoreBgClass(s.score)}`}
                      style={{ height: h }}
                    />
                    <Text style={TYPE.labelSm} className="text-muted-foreground mt-0.5">
                      {s.month.slice(5)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
      {/* ISV disclaimer */}
      <Text style={TYPE.bodySm} className="text-muted-foreground/60 mb-3">
        El ISV es un indicador orientativo basado en inspecciones. No constituye una
        certificaci\u00f3n t\u00e9cnica ni garantiza el estado estructural.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver informe t\u00e9cnico completo"
        onPress={() => {
          const baseUrl = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://app.epde.com.ar';
          void Linking.openURL(`${baseUrl}/properties/${propertyId}/report`);
        }}
        className="border-primary/30 bg-primary/5 items-center rounded-xl border p-3"
      >
        <Text style={TYPE.labelMd} className="text-primary">
          Ver Informe T\u00e9cnico Completo
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground mt-0.5">
          Se abre en el navegador para imprimir o descargar PDF
        </Text>
      </Pressable>
    </CollapsibleSection>
  );
});

/* ── Detected Problems Section ── */
interface PropertyProblemsSectionProps {
  problems: DetectedProblem[];
  onRequestService: () => void;
}

export const PropertyProblemsSection = React.memo(function PropertyProblemsSection({
  problems,
  onRequestService,
}: PropertyProblemsSectionProps) {
  return (
    <CollapsibleSection title={`Puede generarte gastos (${problems.length})`} defaultOpen>
      <Text style={TYPE.bodySm} className="text-muted-foreground mb-2">
        Detectamos problemas que pueden empeorar con el tiempo. Basado en observaciones visuales —
        se recomienda evaluaci\u00f3n por un especialista en el \u00e1rea afectada.
      </Text>
      <View className="gap-2">
        {problems.slice(0, 5).map((problem: DetectedProblem) => (
          <Pressable
            key={problem.taskId}
            className="border-border bg-card rounded-lg border p-3"
            onPress={() => {
              haptics.light();
              onRequestService();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Problema: ${problem.taskName}`}
          >
            <View className="mb-1 flex-row items-start justify-between gap-2">
              <Text
                style={TYPE.titleSm}
                className="text-foreground flex-1 flex-shrink"
                ellipsizeMode="tail"
                numberOfLines={2}
              >
                {problem.taskName}
              </Text>
              <View
                className={`rounded-full px-2 py-0.5 ${problem.severity === 'high' ? 'bg-destructive/15' : 'bg-warning/15'}`}
              >
                <Text
                  style={TYPE.labelSm}
                  className={problem.severity === 'high' ? 'text-destructive' : 'text-warning'}
                >
                  {CONDITION_FOUND_LABELS[problem.conditionFound as ConditionFound] ??
                    problem.conditionFound}
                </Text>
              </View>
            </View>
            <Text
              style={TYPE.bodySm}
              className="text-muted-foreground"
              ellipsizeMode="tail"
              numberOfLines={2}
            >
              {getMobileImpactMessage(problem.sector, problem.severity)}
            </Text>
            {problem.severity === 'high' && (
              <Text style={TYPE.labelSm} className="text-destructive mt-0.5">
                Recomendado resolver cuanto antes
              </Text>
            )}
            <Text style={TYPE.labelMd} className="text-primary mt-1.5">
              Solicitar servicio \u2192
            </Text>
          </Pressable>
        ))}
      </View>
    </CollapsibleSection>
  );
});
