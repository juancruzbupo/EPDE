import type { UpcomingTask } from '@epde/shared';
import { useRouter } from 'expo-router';
import { memo, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AnimatedListItem } from '@/components/animated-list-item';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

interface MobileActionListProps {
  tasks: UpcomingTask[];
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDueLabel(dateStr: string): string {
  const days = getDaysUntil(dateStr);
  if (days < 0) {
    const abs = Math.abs(days);
    return `Vencida hace ${abs} dia${abs > 1 ? 's' : ''}`;
  }
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence manana';
  return `Vence en ${days} dias`;
}

function getDueLabelColor(dateStr: string): string {
  const days = getDaysUntil(dateStr);
  if (days < 0) return 'text-destructive';
  if (days <= 2) return 'text-warning';
  return 'text-muted-foreground';
}

const ActionTaskCard = memo(function ActionTaskCard({
  task,
  index,
  isOverdue,
}: {
  task: UpcomingTask;
  index: number;
  isOverdue: boolean;
}) {
  const router = useRouter();

  const handlePress = () => {
    haptics.light();
    router.push(`/task/${task.maintenancePlanId}/${task.id}` as never);
  };

  const needsProfessional =
    task.professionalRequirement === 'PROFESSIONAL_REQUIRED' ||
    task.professionalRequirement === 'PROFESSIONAL_RECOMMENDED';

  return (
    <AnimatedListItem index={index}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Tarea: ${task.name}`}
        className={`bg-card mb-3 rounded-xl border p-3 ${
          isOverdue ? 'border-destructive/20' : 'border-border'
        }`}
        onPress={handlePress}
      >
        <View className="mb-1 flex-row items-center justify-between">
          <Text style={TYPE.titleSm} className="text-foreground flex-1" numberOfLines={1}>
            {task.name}
          </Text>
          {needsProfessional && (
            <View className="bg-warning/10 border-warning/20 ml-2 rounded-full border px-2 py-0.5">
              <Text style={TYPE.labelSm} className="text-warning">
                Requiere profesional
              </Text>
            </View>
          )}
        </View>

        {task.nextDueDate && (
          <Text style={TYPE.bodySm} className={`mb-1 ${getDueLabelColor(task.nextDueDate)}`}>
            {formatDueLabel(task.nextDueDate)}
          </Text>
        )}

        <View className="flex-row items-center gap-2">
          <Text style={TYPE.labelMd} className="text-muted-foreground">
            {task.categoryName}
          </Text>
          {task.sector && (
            <>
              <Text style={TYPE.bodySm} className="text-muted-foreground">
                ·
              </Text>
              <Text style={TYPE.bodySm} className="text-muted-foreground">
                {task.sector}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    </AnimatedListItem>
  );
});

export const ActionList = memo(function ActionList({ tasks }: MobileActionListProps) {
  const { overdue, upcoming } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const overdueList: UpcomingTask[] = [];
    const upcomingList: UpcomingTask[] = [];

    for (const task of tasks) {
      if (!task.nextDueDate) {
        upcomingList.push(task);
        continue;
      }
      const due = new Date(task.nextDueDate);
      due.setHours(0, 0, 0, 0);
      if (due < now) {
        overdueList.push(task);
      } else if (due <= nextWeek) {
        upcomingList.push(task);
      } else {
        upcomingList.push(task);
      }
    }

    return { overdue: overdueList, upcoming: upcomingList };
  }, [tasks]);

  if (overdue.length === 0 && upcoming.length === 0) {
    return (
      <View className="border-success/20 bg-success/5 mb-4 rounded-xl border p-4">
        <Text style={TYPE.titleMd} className="text-success mb-1">
          Todo al día
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          No tenés tareas pendientes por ahora. Tu hogar está en buen estado.
        </Text>
      </View>
    );
  }

  let globalIndex = 0;

  return (
    <View className="mb-4">
      {overdue.length > 0 && (
        <>
          <Text style={TYPE.titleMd} className="text-destructive mb-2">
            Necesitan atencion ({overdue.length})
          </Text>
          {overdue.map((task) => {
            const idx = globalIndex++;
            return <ActionTaskCard key={task.id} task={task} index={idx} isOverdue />;
          })}
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <Text style={TYPE.titleMd} className="text-foreground mt-1 mb-2">
            Tu semana
          </Text>
          {upcoming.map((task) => {
            const idx = globalIndex++;
            return <ActionTaskCard key={task.id} task={task} index={idx} isOverdue={false} />;
          })}
        </>
      )}
    </View>
  );
});
