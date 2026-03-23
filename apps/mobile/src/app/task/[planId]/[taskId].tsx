// TODO [ROADMAP]: Offline conflict resolution — requires offline mutation
// queue, server-side version/timestamp comparison, and conflict resolution UI.

import type { TaskLogPublic, TaskNotePublic } from '@epde/shared';
import {
  CONDITION_FOUND_LABELS,
  formatRelativeDate,
  ProfessionalRequirement,
  PROPERTY_SECTOR_LABELS,
  RECURRENCE_TYPE_LABELS,
  TASK_TYPE_LABELS,
  TaskStatus,
} from '@epde/shared';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CollapsibleSection } from '@/components/collapsible-section';
import { CompleteTaskModal } from '@/components/complete-task-modal';
import { CreateServiceRequestModal } from '@/components/create-service-request-modal';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PriorityBadge, TaskStatusBadge } from '@/components/status-badge';
import { usePlan } from '@/hooks/use-plans';
import {
  useAddTaskNote,
  useTaskDetail,
  useTaskLogs,
  useTaskNotes,
} from '@/hooks/use-task-operations';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { defaultScreenOptions } from '@/lib/screen-options';

function LogItem({ log }: { log: TaskLogPublic }) {
  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between">
        <Text style={TYPE.labelLg} className="text-foreground">
          {log.user.name}
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {format(new Date(log.completedAt), 'd MMM yyyy', { locale: es })}
        </Text>
      </View>
      {log.notes && (
        <Text style={TYPE.bodyMd} className="text-muted-foreground mt-1">
          {log.notes}
        </Text>
      )}
    </View>
  );
}

function NoteItem({ note }: { note: TaskNotePublic }) {
  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between">
        <Text style={TYPE.labelLg} className="text-foreground">
          {note.author.name}
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {formatRelativeDate(new Date(note.createdAt))}
        </Text>
      </View>
      <Text style={TYPE.bodyMd} className="text-foreground mt-1">
        {note.content}
      </Text>
    </View>
  );
}

export default function TaskDetailScreen() {
  const { planId, taskId } = useLocalSearchParams<{ planId: string; taskId: string }>();
  const contentStyle = useSlideIn('bottom');
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const {
    data: task,
    isLoading: taskLoading,
    error: taskError,
    refetch: refetchTask,
  } = useTaskDetail(planId, taskId);
  const { data: logs, refetch: refetchLogs } = useTaskLogs(planId, taskId);
  const { data: notes, refetch: refetchNotes } = useTaskNotes(planId, taskId);
  const { data: plan } = usePlan(planId);
  const addNote = useAddTaskNote();

  const onRefresh = () => {
    refetchTask();
    refetchLogs();
    refetchNotes();
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    addNote.mutate(
      { planId, taskId, content: noteContent.trim() },
      { onSuccess: () => setNoteContent('') },
    );
  };

  if (taskLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Stack.Screen options={{ headerShown: true, title: 'Tarea', headerBackTitle: 'Volver' }} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (taskError && !task) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen options={{ headerShown: true, title: 'Tarea', headerBackTitle: 'Volver' }} />
        <ErrorState onRetry={refetchTask} />
      </View>
    );
  }

  if (!task) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen options={{ headerShown: true, title: 'Tarea', headerBackTitle: 'Volver' }} />
        <EmptyState title="No encontrada" message="La tarea no existe o fue eliminada." />
      </View>
    );
  }

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isOverdue = task.nextDueDate ? new Date(task.nextDueDate) < new Date() : false;

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          headerShown: true,
          title: task.name,
          headerBackTitle: 'Volver',
          ...defaultScreenOptions,
        }}
      />

      <Animated.ScrollView
        style={contentStyle}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={taskLoading} onRefresh={onRefresh} />}
      >
        {/* Key info: name + date + professional requirement */}
        <View className="border-border bg-card mb-4 rounded-xl border p-4">
          <Text style={TYPE.titleLg} className="text-foreground mb-2">
            {task.name}
          </Text>
          <View className="mb-3 flex-row items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </View>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Próxima fecha
              </Text>
              <Text
                style={TYPE.labelLg}
                className={isOverdue ? 'text-destructive' : 'text-foreground'}
              >
                {task.nextDueDate
                  ? format(new Date(task.nextDueDate), 'd MMM yyyy', { locale: es })
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
                {task.professionalRequirement === ProfessionalRequirement.OWNER_CAN_DO
                  ? 'Sí, podés hacerla vos'
                  : task.professionalRequirement ===
                      ProfessionalRequirement.PROFESSIONAL_RECOMMENDED
                    ? 'Mejor con profesional'
                    : 'Requiere profesional'}
              </Text>
            </View>
          </View>

          {task.description && (
            <Text style={TYPE.bodyMd} className="text-muted-foreground mt-3">
              {task.description}
            </Text>
          )}
        </View>

        {/* Last completion */}
        {logs && logs.length > 0 && (
          <View className="border-border bg-card mb-4 rounded-xl border p-4">
            <Text style={TYPE.labelLg} className="text-muted-foreground mb-1">
              Última completación
            </Text>
            <Text style={TYPE.bodyMd} className="text-foreground">
              {format(new Date(logs[0].completedAt), 'd MMM yyyy', { locale: es })}
              {' · '}
              {CONDITION_FOUND_LABELS[logs[0].conditionFound]}
            </Text>
          </View>
        )}

        {/* More details — collapsed */}
        <CollapsibleSection title="Más detalles">
          <View className="border-border bg-card gap-2 rounded-xl border p-4">
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Recurrencia
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Tipo
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {TASK_TYPE_LABELS[task.taskType]}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Categoría
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {task.category.name}
              </Text>
            </View>
            {task.sector && (
              <View className="flex-row justify-between">
                <Text style={TYPE.bodyMd} className="text-muted-foreground">
                  Sector
                </Text>
                <Text style={TYPE.labelLg} className="text-foreground">
                  {PROPERTY_SECTOR_LABELS[task.sector] ?? task.sector}
                </Text>
              </View>
            )}
            {task.estimatedDurationMinutes != null && (
              <View className="flex-row justify-between">
                <Text style={TYPE.bodyMd} className="text-muted-foreground">
                  Duración
                </Text>
                <Text style={TYPE.labelLg} className="text-foreground">
                  {task.estimatedDurationMinutes} min
                </Text>
              </View>
            )}
            {task.technicalDescription && (
              <View className="border-border mt-1 border-t pt-2">
                <Text style={TYPE.bodySm} className="text-muted-foreground mb-1">
                  Descripción técnica
                </Text>
                <Text style={TYPE.bodyMd} className="text-foreground">
                  {task.technicalDescription}
                </Text>
              </View>
            )}
          </View>
        </CollapsibleSection>

        {/* Task Logs */}
        <CollapsibleSection title="Historial" count={logs?.length ?? 0}>
          <View className="border-border bg-card rounded-xl border px-4">
            {logs && logs.length > 0 ? (
              logs.map((log) => <LogItem key={log.id} log={log} />)
            ) : (
              <View className="py-4">
                <Text style={TYPE.bodyMd} className="text-muted-foreground text-center">
                  Sin registros de completado
                </Text>
              </View>
            )}
          </View>
        </CollapsibleSection>

        {/* Task Notes */}
        <CollapsibleSection title="Notas" count={notes?.length ?? 0}>
          {/* Add note form */}
          <View className="mb-3 flex-row items-end gap-2">
            <TextInput
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="Agregar una nota..."
              placeholderTextColor={COLORS.mutedForeground}
              multiline
              maxLength={2000}
              style={[TYPE.bodyMd, { minHeight: 40, textAlignVertical: 'top' }]}
              className="border-border bg-card text-foreground flex-1 rounded-xl border px-3 py-2"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar nota"
              onPress={handleAddNote}
              disabled={!noteContent.trim() || addNote.isPending}
              className={`rounded-xl px-4 py-2.5 ${noteContent.trim() ? 'bg-primary' : 'bg-muted'}`}
            >
              <Text
                style={TYPE.titleSm}
                className={noteContent.trim() ? 'text-primary-foreground' : 'text-muted-foreground'}
              >
                Enviar
              </Text>
            </Pressable>
          </View>

          <View className="border-border bg-card rounded-xl border px-4">
            {notes && notes.length > 0 ? (
              notes.map((note) => <NoteItem key={note.id} note={note} />)
            ) : (
              <View className="py-4">
                <Text style={TYPE.bodyMd} className="text-muted-foreground text-center">
                  Sin notas
                </Text>
              </View>
            )}
          </View>
        </CollapsibleSection>
      </Animated.ScrollView>

      {/* Sticky CTA footer */}
      <View className="border-border border-t px-4 py-3">
        <View className="flex-row gap-2">
          {!isCompleted && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Completar tarea"
              onPress={() => setCompleteModalVisible(true)}
              className="bg-primary flex-1 items-center rounded-xl py-3"
            >
              <Text style={TYPE.titleMd} className="text-primary-foreground">
                Completar Tarea
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Solicitar servicio"
            className={`border-border items-center rounded-xl border py-3 ${!isCompleted ? '' : 'flex-1'}`}
            onPress={() => {
              haptics.light();
              setShowServiceModal(true);
            }}
          >
            <Text style={TYPE.labelMd} className="text-foreground px-4">
              Solicitar Servicio
            </Text>
          </Pressable>
        </View>
        {task.professionalRequirement !== ProfessionalRequirement.OWNER_CAN_DO && (
          <Text style={TYPE.bodySm} className="text-muted-foreground mt-1 text-center">
            Esta tarea requiere intervención profesional
          </Text>
        )}
      </View>

      {/* Complete task modal */}
      <CompleteTaskModal
        visible={completeModalVisible}
        onClose={() => setCompleteModalVisible(false)}
        task={task}
        planId={planId}
      />

      {/* Service request modal */}
      <CreateServiceRequestModal
        visible={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        defaultPropertyId={plan?.property?.id}
        defaultTaskId={task.id}
        defaultTitle={`Solicitud: ${task.name}`}
        defaultDescription={`Tarea: ${task.name} — ${task.category?.name ?? ''}`}
      />
    </View>
  );
}
