import type { TaskPriority, TaskStatus as TaskStatusEnum } from '@epde/shared';
import { ProfessionalRequirement, RECURRENCE_TYPE_LABELS } from '@epde/shared';
import React from 'react';
import { Text, View } from 'react-native';

import { PriorityBadge, TaskStatusBadge } from '@/components/status-badge';
import { formatDateES } from '@/lib/date-format';
import { TYPE } from '@/lib/fonts';

interface TaskInfoCardProps {
  name: string;
  status: TaskStatusEnum;
  priority: TaskPriority;
  nextDueDate: string | null;
  isOverdue: boolean;
  professionalRequirement: string;
  description: string | null;
}

export const TaskInfoCard = React.memo(function TaskInfoCard({
  name,
  status,
  priority,
  nextDueDate,
  isOverdue,
  professionalRequirement,
  description,
}: TaskInfoCardProps) {
  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <Text style={TYPE.titleLg} className="text-foreground mb-2">
        {name}
      </Text>
      <View className="mb-3 flex-row items-center gap-2">
        <TaskStatusBadge status={status} />
        <PriorityBadge priority={priority} />
      </View>

      <View className="gap-2">
        <View className="flex-row justify-between">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Próxima fecha
          </Text>
          <Text style={TYPE.labelLg} className={isOverdue ? 'text-destructive' : 'text-foreground'}>
            {nextDueDate
              ? formatDateES(new Date(nextDueDate))
              : RECURRENCE_TYPE_LABELS.ON_DETECTION}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            ¿Puedo hacerlo yo?
          </Text>
          <Text style={TYPE.labelLg} className="text-foreground">
            {/* Intentional: mobile uses conversational labels (vs shared's formal
                PROFESSIONAL_REQUIREMENT_LABELS) for better homeowner UX. */}
            {professionalRequirement === ProfessionalRequirement.OWNER_CAN_DO
              ? 'Sí, podés hacerla vos'
              : professionalRequirement === ProfessionalRequirement.PROFESSIONAL_RECOMMENDED
                ? 'Mejor con profesional'
                : 'Requiere profesional'}
          </Text>
        </View>
      </View>

      {description && (
        <Text style={TYPE.bodyMd} className="text-muted-foreground mt-3">
          {description}
        </Text>
      )}
    </View>
  );
});
