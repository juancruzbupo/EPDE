import type { PropertySector, RecurrenceType, TaskType } from '@epde/shared';
import { PROPERTY_SECTOR_LABELS, RECURRENCE_TYPE_LABELS, TASK_TYPE_LABELS } from '@epde/shared';
import React from 'react';
import { Text, View } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { TYPE } from '@/lib/fonts';

interface TaskDetailSectionsProps {
  recurrenceType: RecurrenceType;
  taskType: TaskType;
  categoryName: string;
  sector: PropertySector | null;
  estimatedDurationMinutes: number | null;
  technicalDescription: string | null;
}

export const TaskDetailSections = React.memo(function TaskDetailSections({
  recurrenceType,
  taskType,
  categoryName,
  sector,
  estimatedDurationMinutes,
  technicalDescription,
}: TaskDetailSectionsProps) {
  return (
    <CollapsibleSection title="Más detalles">
      <View className="border-border bg-card gap-2 rounded-xl border p-4">
        <View className="flex-row justify-between">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Recurrencia
          </Text>
          <Text style={TYPE.labelLg} className="text-foreground">
            {RECURRENCE_TYPE_LABELS[recurrenceType] ?? recurrenceType}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Tipo
          </Text>
          <Text style={TYPE.labelLg} className="text-foreground">
            {TASK_TYPE_LABELS[taskType]}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Categoría
          </Text>
          <Text style={TYPE.labelLg} className="text-foreground">
            {categoryName}
          </Text>
        </View>
        {sector && (
          <View className="flex-row justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Sector
            </Text>
            <Text style={TYPE.labelLg} className="text-foreground">
              {PROPERTY_SECTOR_LABELS[sector] ?? sector}
            </Text>
          </View>
        )}
        {estimatedDurationMinutes != null && (
          <View className="flex-row justify-between">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Duración
            </Text>
            <Text style={TYPE.labelLg} className="text-foreground">
              {estimatedDurationMinutes} min
            </Text>
          </View>
        )}
        {technicalDescription && (
          <View className="border-border mt-1 border-t pt-2">
            <Text style={TYPE.bodySm} className="text-muted-foreground mb-1">
              Descripción técnica
            </Text>
            <Text style={TYPE.bodyMd} className="text-foreground">
              {technicalDescription}
            </Text>
          </View>
        )}
      </View>
    </CollapsibleSection>
  );
});
