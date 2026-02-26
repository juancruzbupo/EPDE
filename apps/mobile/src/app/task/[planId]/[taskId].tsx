import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useTaskDetail,
  useTaskLogs,
  useTaskNotes,
  useAddTaskNote,
} from '@/hooks/use-maintenance-plans';
import { TaskStatusBadge, PriorityBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { CompleteTaskModal } from '@/components/complete-task-modal';
import type { TaskLogPublic, TaskNotePublic } from '@epde/shared/types';

const recurrenceLabels: Record<string, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  BIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  CUSTOM: 'Personalizada',
};

function LogItem({ log }: { log: TaskLogPublic }) {
  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between">
        <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
          {log.user.name}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted-foreground text-xs">
          {format(new Date(log.completedAt), 'd MMM yyyy', { locale: es })}
        </Text>
      </View>
      {log.notes && (
        <Text
          style={{ fontFamily: 'DMSans_400Regular' }}
          className="text-muted-foreground mt-1 text-sm"
        >
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
        <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
          {note.author.name}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: es })}
        </Text>
      </View>
      <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-foreground mt-1 text-sm">
        {note.content}
      </Text>
    </View>
  );
}

export default function TaskDetailScreen() {
  const { planId, taskId } = useLocalSearchParams<{ planId: string; taskId: string }>();
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const {
    data: task,
    isLoading: taskLoading,
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
        <ActivityIndicator size="large" color="#c4704b" />
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

  const isCompleted = task.status === 'COMPLETED';

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          headerShown: true,
          title: task.name,
          headerBackTitle: 'Volver',
          headerStyle: { backgroundColor: '#fafaf8' },
          headerTintColor: '#2e2a27',
          headerTitleStyle: { fontFamily: 'DMSans_700Bold' },
        }}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={taskLoading} onRefresh={onRefresh} />}
      >
        {/* Task info card */}
        <View className="border-border bg-card mb-4 rounded-xl border p-4">
          <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-2 text-lg">
            {task.name}
          </Text>

          {task.description && (
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-muted-foreground mb-3 text-sm"
            >
              {task.description}
            </Text>
          )}

          <View className="mb-3 flex-row items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </View>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted-foreground text-sm"
              >
                Recurrencia
              </Text>
              <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
                {recurrenceLabels[task.recurrenceType] ?? task.recurrenceType}
                {task.recurrenceMonths ? ` (${task.recurrenceMonths} meses)` : ''}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted-foreground text-sm"
              >
                Proxima fecha
              </Text>
              <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
                {format(new Date(task.nextDueDate), 'd MMM yyyy', { locale: es })}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted-foreground text-sm"
              >
                Categoria
              </Text>
              <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
                {task.category.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Complete task button */}
        {!isCompleted && (
          <Pressable
            onPress={() => setCompleteModalVisible(true)}
            className="bg-primary mb-4 items-center rounded-xl py-3"
          >
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className="text-primary-foreground text-base"
            >
              Completar Tarea
            </Text>
          </Pressable>
        )}

        {/* Task Logs */}
        <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-2 text-base">
          Historial
        </Text>
        <View className="border-border bg-card mb-4 rounded-xl border px-4">
          {logs && logs.length > 0 ? (
            logs.map((log) => <LogItem key={log.id} log={log} />)
          ) : (
            <View className="py-4">
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted-foreground text-center text-sm"
              >
                Sin registros de completado
              </Text>
            </View>
          )}
        </View>

        {/* Task Notes */}
        <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-2 text-base">
          Notas
        </Text>

        {/* Add note form */}
        <View className="mb-3 flex-row items-end gap-2">
          <TextInput
            value={noteContent}
            onChangeText={setNoteContent}
            placeholder="Agregar una nota..."
            placeholderTextColor="#4a4542"
            multiline
            style={{ fontFamily: 'DMSans_400Regular', minHeight: 40, textAlignVertical: 'top' }}
            className="border-border bg-card text-foreground flex-1 rounded-xl border px-3 py-2 text-sm"
          />
          <Pressable
            onPress={handleAddNote}
            disabled={!noteContent.trim() || addNote.isPending}
            className={`rounded-xl px-4 py-2.5 ${noteContent.trim() ? 'bg-primary' : 'bg-muted'}`}
          >
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className={`text-sm ${noteContent.trim() ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Enviar
            </Text>
          </Pressable>
        </View>

        <View className="border-border bg-card mb-4 rounded-xl border px-4">
          {notes && notes.length > 0 ? (
            notes.map((note) => <NoteItem key={note.id} note={note} />)
          ) : (
            <View className="py-4">
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted-foreground text-center text-sm"
              >
                Sin notas
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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
