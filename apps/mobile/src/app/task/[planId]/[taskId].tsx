// TODO [ROADMAP]: Offline conflict resolution — requires offline mutation
// queue, server-side version/timestamp comparison, and conflict resolution UI.

// TODO [ROADMAP]: Migrate to expo-image for caching, progressive loading, and optimization.

import type { TaskLogPublic, TaskNotePublic } from '@epde/shared';
import {
  CONDITION_FOUND_LABELS,
  formatRelativeDate,
  PROFESSIONAL_REQUIREMENT_LABELS,
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
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PriorityBadge, TaskStatusBadge } from '@/components/status-badge';
import {
  useAddTaskNote,
  useTaskDetail,
  useTaskLogs,
  useTaskNotes,
} from '@/hooks/use-task-operations';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
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
  const [noteContent, setNoteContent] = useState('');

  const {
    data: task,
    isLoading: taskLoading,
    error: taskError,
    refetch: refetchTask,
  } = useTaskDetail(planId, taskId);
  const { data: logs, refetch: refetchLogs } = useTaskLogs(planId, taskId);
  const { data: notes, refetch: refetchNotes } = useTaskNotes(planId, taskId);
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
        {/* Task info card */}
        <View className="border-border bg-card mb-4 rounded-xl border p-4">
          <Text style={TYPE.titleLg} className="text-foreground mb-2">
            {task.name}
          </Text>

          {task.description && (
            <Text style={TYPE.bodyMd} className="text-muted-foreground mb-3">
              {task.description}
            </Text>
          )}

          <View className="mb-3 flex-row items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </View>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Recurrencia
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {RECURRENCE_TYPE_LABELS[task.recurrenceType] ?? task.recurrenceType}
                {task.recurrenceMonths ? ` (${task.recurrenceMonths} meses)` : ''}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Tipo de tarea
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {TASK_TYPE_LABELS[task.taskType]}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Profesional
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {PROFESSIONAL_REQUIREMENT_LABELS[task.professionalRequirement]}
              </Text>
            </View>
            {task.estimatedDurationMinutes != null && (
              <View className="flex-row justify-between">
                <Text style={TYPE.bodyMd} className="text-muted-foreground">
                  Duración estimada
                </Text>
                <Text style={TYPE.labelLg} className="text-foreground">
                  {task.estimatedDurationMinutes} minutos
                </Text>
              </View>
            )}
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Proxima fecha
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {task.nextDueDate
                  ? format(new Date(task.nextDueDate), 'd MMM yyyy', { locale: es })
                  : 'Según detección'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Categoria
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {task.category.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Technical description */}
        {task.technicalDescription ? (
          <CollapsibleSection title="Descripción técnica">
            <View className="border-border bg-card rounded-xl border px-4 py-3">
              <Text style={TYPE.bodyMd} className="text-foreground leading-relaxed">
                {task.technicalDescription}
              </Text>
            </View>
          </CollapsibleSection>
        ) : null}

        {/* Last completion */}
        {logs && logs.length > 0 && (
          <View className="border-border bg-card mb-4 rounded-xl border p-4">
            <Text style={TYPE.labelLg} className="text-muted-foreground mb-1">
              Última completación
            </Text>
            <Text style={TYPE.bodyMd} className="text-foreground">
              {format(new Date(logs[0].completedAt), 'd MMM yyyy', { locale: es })}
            </Text>
            <Text style={TYPE.bodyMd} className="text-foreground">
              Condición: {CONDITION_FOUND_LABELS[logs[0].conditionFound]}
            </Text>
            <Text style={TYPE.bodySm} className="text-muted-foreground">
              Por: {logs[0].user.name}
            </Text>
          </View>
        )}

        {/* Complete task button */}
        {!isCompleted && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Completar tarea"
            onPress={() => setCompleteModalVisible(true)}
            className="bg-primary mb-4 items-center rounded-xl py-3"
          >
            <Text style={TYPE.titleMd} className="text-primary-foreground">
              Completar Tarea
            </Text>
          </Pressable>
        )}

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

      {/* Complete task modal */}
      <CompleteTaskModal
        visible={completeModalVisible}
        onClose={() => setCompleteModalVisible(false)}
        task={task}
        planId={planId}
      />
    </View>
  );
}
