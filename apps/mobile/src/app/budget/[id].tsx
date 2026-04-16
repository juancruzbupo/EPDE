import { BudgetStatus, isBudgetTerminal, UserRole } from '@epde/shared';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { EditBudgetModal } from '@/components/edit-budget-modal';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { RespondBudgetModal } from '@/components/respond-budget-modal';
import {
  useAddBudgetAttachments,
  useAddBudgetComment,
  useBudget,
  useBudgetAuditLog,
  useBudgetComments,
  useEditBudgetRequest,
  useUpdateBudgetStatus,
} from '@/hooks/use-budgets';
import { useUploadFile } from '@/hooks/use-upload';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { confirm as confirmDialog } from '@/lib/confirm';
import { haptics } from '@/lib/haptics';
import { defaultScreenOptions } from '@/lib/screen-options';
import { useAuthStore } from '@/stores/auth-store';

import { BudgetAttachments } from './components/budget-attachments';
import { BudgetComments } from './components/budget-comments';
import { BudgetInfoCard } from './components/budget-info-card';
import { BudgetLineItems } from './components/budget-line-items';
import { BudgetStatusActions } from './components/budget-status-actions';
import { BudgetTimeline } from './components/budget-timeline';

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENT;
  const { data: budget, isLoading, error, refetch } = useBudget(id);
  const contentStyle = useSlideIn('bottom');
  const updateStatus = useUpdateBudgetStatus();
  const editBudget = useEditBudgetRequest();
  const { data: auditLog } = useBudgetAuditLog(id);
  const { data: comments } = useBudgetComments(id);
  const addComment = useAddBudgetComment();
  const uploadFile = useUploadFile();
  const addAttachments = useAddBudgetAttachments();
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [editTitleVisible, setEditTitleVisible] = useState(false);
  const [respondVisible, setRespondVisible] = useState(false);

  const isTerminal = budget ? isBudgetTerminal(budget.status) : false;

  const handleApprove = useCallback(async () => {
    haptics.medium();
    const ok = await confirmDialog({
      title: 'Aprobar presupuesto',
      message: '¿Seguro que querés aprobar este presupuesto?',
      confirmLabel: 'Aprobar presupuesto',
    });
    if (ok) updateStatus.mutate({ id, status: BudgetStatus.APPROVED });
  }, [id, updateStatus]);

  const handleReject = useCallback(async () => {
    haptics.medium();
    const ok = await confirmDialog({
      title: 'Rechazar presupuesto',
      message: '¿Seguro que querés rechazar este presupuesto?',
      confirmLabel: 'Rechazar presupuesto',
      destructive: true,
    });
    if (ok) updateStatus.mutate({ id, status: BudgetStatus.REJECTED });
  }, [id, updateStatus]);

  const handleStartWork = useCallback(async () => {
    haptics.medium();
    const ok = await confirmDialog({
      title: 'Iniciar trabajo',
      message: '¿Seguro que querés marcar este presupuesto como en curso?',
      confirmLabel: 'Iniciar trabajo',
    });
    if (ok) updateStatus.mutate({ id, status: BudgetStatus.IN_PROGRESS });
  }, [id, updateStatus]);

  const handleMarkCompleted = useCallback(() => {
    haptics.medium();
    Alert.alert('Marcar Completado', '¿Estás seguro de que querés marcar como completado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Completar',
        onPress: () => updateStatus.mutate({ id, status: BudgetStatus.COMPLETED }),
      },
    ]);
  }, [id, updateStatus]);

  const handleEdit = useCallback(() => {
    if (!budget) return;
    haptics.light();
    setEditTitleVisible(true);
  }, [budget]);

  const handleAddComment = useCallback(() => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    haptics.light();
    addComment.mutate({ budgetId: id, content: trimmed }, { onSuccess: () => setCommentText('') });
  }, [commentText, id, addComment]);

  const uploadAttachmentFromUri = useCallback(
    async (uri: string) => {
      const fileName = uri.split('/').pop() ?? 'adjunto.jpg';
      setIsUploadingAttachment(true);
      try {
        const url = await uploadFile.mutateAsync({ uri, folder: 'budgets' });
        await addAttachments.mutateAsync({
          budgetId: id,
          attachments: [{ url, fileName }],
        });
        haptics.success();
      } catch {
        Alert.alert('Error', 'No se pudo subir el archivo.');
      } finally {
        setIsUploadingAttachment(false);
      }
    },
    [id, uploadFile, addAttachments],
  );

  const handleAddAttachment = useCallback(() => {
    Alert.alert('Adjuntar archivo', 'Elegir origen', [
      {
        text: 'Cámara',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
          if (!result.canceled && result.assets[0]) {
            uploadAttachmentFromUri(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Galería',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la galería.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
          if (!result.canceled && result.assets[0]) {
            uploadAttachmentFromUri(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [uploadAttachmentFromUri]);

  const handleQuote = useCallback(() => {
    haptics.light();
    setRespondVisible(true);
  }, []);

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Stack.Screen
          options={{ headerShown: true, title: 'Presupuesto', headerBackTitle: 'Volver' }}
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error && !budget) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{ headerShown: true, title: 'Presupuesto', headerBackTitle: 'Volver' }}
        />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  if (!budget) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{ headerShown: true, title: 'Presupuesto', headerBackTitle: 'Volver' }}
        />
        <EmptyState title="No encontrado" message="El presupuesto no existe o fue eliminado." />
      </View>
    );
  }

  return (
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Presupuesto',
          headerBackTitle: 'Volver',
          ...defaultScreenOptions,
        }}
      />

      <Animated.ScrollView
        style={contentStyle}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
      >
        <BudgetInfoCard
          title={budget.title}
          description={budget.description}
          status={budget.status}
          propertyAddress={budget.property.address}
          createdAt={budget.createdAt}
          showEditButton={isClient && budget.status === BudgetStatus.PENDING}
          editDisabled={editBudget.isPending}
          onEdit={handleEdit}
        />

        {budget.response && (
          <BudgetLineItems
            lineItems={budget.lineItems}
            totalAmount={budget.response.totalAmount}
            estimatedDays={budget.response.estimatedDays}
            validUntil={budget.response.validUntil}
            notes={budget.response.notes}
          />
        )}

        <BudgetStatusActions
          status={budget.status}
          isAdmin={isAdmin}
          isClient={isClient}
          isStatusPending={updateStatus.isPending}
          onApprove={handleApprove}
          onReject={handleReject}
          onStartWork={handleStartWork}
          onMarkCompleted={handleMarkCompleted}
          onQuote={handleQuote}
        />

        <BudgetAttachments
          attachments={budget.attachments}
          isTerminal={isTerminal}
          isUploading={isUploadingAttachment}
          onAddAttachment={handleAddAttachment}
        />

        <BudgetComments
          comments={comments}
          isTerminal={isTerminal}
          commentText={commentText}
          onCommentTextChange={setCommentText}
          onAddComment={handleAddComment}
          isAddingComment={addComment.isPending}
        />

        <BudgetTimeline auditLog={auditLog} />
      </Animated.ScrollView>

      <EditBudgetModal
        visible={editTitleVisible}
        defaultTitle={budget.title}
        defaultDescription={budget.description ?? null}
        onSubmit={({ title, description }) => editBudget.mutate({ id, title, description })}
        onClose={() => setEditTitleVisible(false)}
      />

      <RespondBudgetModal
        visible={respondVisible}
        onClose={() => setRespondVisible(false)}
        budgetId={id}
        initialLineItems={budget.status === BudgetStatus.QUOTED ? budget.lineItems : undefined}
        initialEstimatedDays={
          budget.status === BudgetStatus.QUOTED ? budget.response?.estimatedDays : undefined
        }
        initialValidUntil={
          budget.status === BudgetStatus.QUOTED ? budget.response?.validUntil : undefined
        }
        initialNotes={budget.status === BudgetStatus.QUOTED ? budget.response?.notes : undefined}
      />
    </View>
  );
}
