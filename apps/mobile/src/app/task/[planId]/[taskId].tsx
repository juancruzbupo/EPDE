// TODO [ROADMAP]: Offline conflict resolution — requires offline mutation
// queue, server-side version/timestamp comparison, and conflict resolution UI.

import type { PropertySector, RecurrenceType, TaskType } from '@epde/shared';
import { CONDITION_FOUND_LABELS, ProfessionalRequirement, TaskStatus } from '@epde/shared';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { CompleteTaskModal } from '@/components/complete-task-modal';
import { CreateServiceRequestModal } from '@/components/create-service-request-modal';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Spinner } from '@/components/spinner';
import { usePlan } from '@/hooks/use-plans';
import {
  useAddTaskNote,
  useTaskDetail,
  useTaskLogs,
  useTaskNotes,
} from '@/hooks/use-task-operations';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { formatDateES } from '@/lib/date-format';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { defaultScreenOptions } from '@/lib/screen-options';

import { TaskDetailSections } from '../components/task-detail-sections';
import { TaskInfoCard } from '../components/task-info-card';
import { TaskLogsSection } from '../components/task-logs-section';
import { TaskNotesSection } from '../components/task-notes-section';

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
        <Spinner size="large" color={COLORS.primary} label="Cargando tarea" />
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-background flex-1"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: task.name,
          headerBackTitle: 'Volver',
          ...defaultScreenOptions,
        }}
      />

      <Animated.ScrollView
        keyboardShouldPersistTaps="handled"
        style={contentStyle}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={taskLoading} onRefresh={onRefresh} />}
      >
        <TaskInfoCard
          name={task.name}
          status={task.status}
          priority={task.priority}
          nextDueDate={task.nextDueDate}
          isOverdue={isOverdue}
          professionalRequirement={task.professionalRequirement}
          description={task.description}
        />

        {/* Last completion */}
        {logs && logs.length > 0 && (
          <View className="border-border bg-card mb-4 rounded-xl border p-4">
            <Text style={TYPE.labelLg} className="text-muted-foreground mb-1">
              Última completación
            </Text>
            <Text style={TYPE.bodyMd} className="text-foreground">
              {formatDateES(new Date(logs[0].completedAt))}
              {' · '}
              {CONDITION_FOUND_LABELS[logs[0].conditionFound]}
            </Text>
          </View>
        )}

        <TaskDetailSections
          recurrenceType={task.recurrenceType as RecurrenceType}
          taskType={task.taskType as TaskType}
          categoryName={task.category.name}
          sector={(task.sector as PropertySector) ?? null}
          estimatedDurationMinutes={task.estimatedDurationMinutes ?? null}
          technicalDescription={task.technicalDescription ?? null}
        />

        <TaskLogsSection logs={logs} />

        <TaskNotesSection
          notes={notes}
          noteContent={noteContent}
          onNoteContentChange={setNoteContent}
          onAddNote={handleAddNote}
          isAddingNote={addNote.isPending}
        />
      </Animated.ScrollView>

      {/* Sticky CTA footer */}
      <View className="border-border border-t px-4 py-3">
        <View className="flex-row gap-2">
          {!isCompleted && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Registrar inspección"
              onPress={() => setCompleteModalVisible(true)}
              className="bg-primary flex-1 items-center justify-center rounded-xl"
              style={{ minHeight: 44 }}
            >
              <Text style={TYPE.titleMd} className="text-primary-foreground">
                Registrar Inspección
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Solicitar servicio"
            className={`border-border items-center justify-center rounded-xl border ${!isCompleted ? '' : 'flex-1'}`}
            style={{ minHeight: 44 }}
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
        onProblemDetected={() => {
          Alert.alert(
            'Problema detectado',
            'Se detectó un problema en esta tarea. ¿Querés solicitar un servicio?',
            [
              { text: 'No', style: 'cancel' },
              { text: 'Solicitar servicio', onPress: () => setShowServiceModal(true) },
            ],
          );
        }}
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
    </KeyboardAvoidingView>
  );
}
