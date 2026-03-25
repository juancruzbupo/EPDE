import type { TaskPublic } from '@epde/shared';
import {
  formatRelativeDate,
  PROPERTY_SECTOR_LABELS,
  RECURRENCE_TYPE_LABELS,
  TaskStatus,
} from '@epde/shared';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { PriorityBadge, TaskStatusBadge } from '@/components/status-badge';
import { TYPE } from '@/lib/fonts';

interface PropertyTaskCardProps {
  task: TaskPublic;
  planId: string;
}

export function PropertyTaskCard({ task, planId }: PropertyTaskCardProps) {
  const router = useRouter();

  const statusDotColor =
    task.status === TaskStatus.OVERDUE
      ? 'bg-destructive'
      : task.status === TaskStatus.UPCOMING
        ? 'bg-primary'
        : 'bg-muted-foreground';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tarea: ${task.name}`}
      className="border-border bg-card mb-2 rounded-xl border p-3"
      onPress={() => router.push(`/task/${planId}/${task.id}` as never)}
    >
      <View className="mb-1 flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${statusDotColor}`} />
        <Text style={TYPE.titleSm} className="text-foreground flex-1 flex-shrink" numberOfLines={2}>
          {task.name}
        </Text>
        <PriorityBadge priority={task.priority} />
      </View>
      <View className="ml-4 flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
        <TaskStatusBadge status={task.status} />
        {task.sector && (
          <Text style={TYPE.labelMd} className="text-muted-foreground" numberOfLines={1}>
            {PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}
          </Text>
        )}
        <Text style={TYPE.bodySm} className="text-muted-foreground ml-auto" numberOfLines={1}>
          {task.nextDueDate
            ? formatRelativeDate(new Date(task.nextDueDate))
            : RECURRENCE_TYPE_LABELS.ON_DETECTION}
        </Text>
      </View>
    </Pressable>
  );
}
