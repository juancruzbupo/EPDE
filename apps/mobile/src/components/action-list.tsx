import type { UpcomingTask } from '@epde/shared';
import { ProfessionalRequirement, PROPERTY_SECTOR_LABELS } from '@epde/shared';
import { useRouter } from 'expo-router';
import { memo, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AnimatedListItem } from '@/components/animated-list-item';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

interface MobileActionListProps {
  tasks: UpcomingTask[];
  nextUpcoming?: UpcomingTask | null;
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
    if (abs >= 30) {
      const months = Math.floor(abs / 30);
      return `Vencida hace ${months} mes${months > 1 ? 'es' : ''}`;
    }
    return `Vencida hace ${abs} día${abs > 1 ? 's' : ''}`;
  }
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días`;
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

  const handleRegister = () => {
    haptics.medium();
    router.push(`/task/${task.maintenancePlanId}/${task.id}` as never);
  };

  const needsProfessional = task.professionalRequirement !== ProfessionalRequirement.OWNER_CAN_DO;

  return (
    <AnimatedListItem index={index}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Tarea: ${task.name}`}
        accessibilityHint="Navega al detalle de la tarea"
        className={`bg-card mb-3 rounded-xl border p-3 ${
          isOverdue ? 'border-destructive/20' : 'border-border'
        }`}
        onPress={handlePress}
      >
        <View className="mb-1 flex-row items-center justify-between">
          <Text
            style={TYPE.titleSm}
            className="text-foreground flex-1"
            ellipsizeMode="tail"
            numberOfLines={1}
          >
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

        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-2">
            <Text style={TYPE.labelMd} className="text-muted-foreground">
              {task.categoryName}
            </Text>
            {task.sector && (
              <>
                <Text style={TYPE.bodySm} className="text-muted-foreground">
                  ·
                </Text>
                <Text style={TYPE.bodySm} className="text-muted-foreground">
                  {PROPERTY_SECTOR_LABELS[task.sector as keyof typeof PROPERTY_SECTOR_LABELS] ??
                    task.sector}
                </Text>
              </>
            )}
          </View>
          {isOverdue && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Registrar inspección de ${task.name}`}
              onPress={handleRegister}
              className="bg-destructive rounded-lg px-3 py-1.5 active:opacity-80"
            >
              <Text style={TYPE.labelSm} className="text-destructive-foreground">
                Registrar
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </AnimatedListItem>
  );
});

/** Highlighted card for the next upcoming inspection */
const NextInspectionCard = memo(function NextInspectionCard({ task }: { task: UpcomingTask }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Próxima inspección: ${task.name}`}
      accessibilityHint="Toca para ver detalles de la tarea"
      className="border-status-upcoming/20 bg-status-upcoming/5 mb-4 flex-row items-center rounded-xl border p-3"
      onPress={() => {
        haptics.light();
        router.push(`/task/${task.maintenancePlanId}/${task.id}` as never);
      }}
    >
      <View className="bg-status-upcoming/10 mr-3 h-10 w-10 items-center justify-center rounded-lg">
        <Text style={{ fontSize: 20 }}>📋</Text>
      </View>
      <View className="flex-1">
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          Próxima inspección
        </Text>
        <Text
          style={TYPE.titleSm}
          className="text-foreground"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {task.name}
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {task.propertyAddress}
          {task.nextDueDate && ` · ${formatDueLabel(task.nextDueDate)}`}
        </Text>
      </View>
      <Text className="text-muted-foreground" style={TYPE.titleSm}>
        &gt;
      </Text>
    </Pressable>
  );
});

export const ActionList = memo(function ActionList({ tasks, nextUpcoming }: MobileActionListProps) {
  const router = useRouter();
  const { overdue, upcoming } = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return {
      overdue: tasks.filter((t) => t.nextDueDate && new Date(t.nextDueDate) < now),
      upcoming: tasks.filter(
        (t) =>
          t.nextDueDate && new Date(t.nextDueDate) >= now && new Date(t.nextDueDate) <= weekFromNow,
      ),
    };
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
            Necesitan atención ({overdue.length})
          </Text>
          {overdue.slice(0, 5).map((task) => {
            const idx = globalIndex++;
            return <ActionTaskCard key={task.id} task={task} index={idx} isOverdue />;
          })}
          {overdue.length > 5 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver las ${overdue.length} tareas vencidas`}
              onPress={() => {
                haptics.light();
                router.push('/tasks' as never);
              }}
              className="mb-3 items-center py-2"
            >
              <Text style={TYPE.labelMd} className="text-destructive">
                Ver las {overdue.length} tareas vencidas →
              </Text>
            </Pressable>
          )}
        </>
      )}

      {nextUpcoming && <NextInspectionCard task={nextUpcoming} />}

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
