import { isServiceRequestTerminal, ServiceStatus, ServiceUrgency, UserRole } from '@epde/shared';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CreateBudgetModal } from '@/components/create-budget-modal';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Spinner } from '@/components/spinner';
import {
  useAddServiceRequestAttachments,
  useAddServiceRequestComment,
  useEditServiceRequest,
  useServiceRequest,
  useServiceRequestAuditLog,
  useServiceRequestComments,
  useUpdateServiceStatus,
} from '@/hooks/use-service-requests';
import { useUploadFile } from '@/hooks/use-upload';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { defaultScreenOptions } from '@/lib/screen-options';
import { useAuthStore } from '@/stores/auth-store';

import { EditServiceRequestModal } from './components/edit-service-request-modal';
import { ServiceRequestAttachments } from './components/service-request-attachments';
import { ServiceRequestComments } from './components/service-request-comments';
import { ServiceRequestInfoCard } from './components/service-request-info-card';
import { ServiceRequestPhotos } from './components/service-request-photos';
import {
  ServiceRequestStatusActions,
  STATUS_TRANSITIONS,
} from './components/service-request-status-actions';
import { ServiceRequestTimeline } from './components/service-request-timeline';

// ─── Main Screen ────────────────────────────────────────────

export default function ServiceRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENT;
  const contentStyle = useSlideIn('bottom');
  const { data: request, isLoading, error, refetch } = useServiceRequest(id);
  const editRequest = useEditServiceRequest();
  const updateStatus = useUpdateServiceStatus();
  const { data: auditLog } = useServiceRequestAuditLog(id);
  const { data: comments } = useServiceRequestComments(id);
  const addComment = useAddServiceRequestComment();
  const uploadFile = useUploadFile();
  const addAttachments = useAddServiceRequestAttachments();
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [editTitleVisible, setEditTitleVisible] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [createBudgetVisible, setCreateBudgetVisible] = useState(false);

  const isTerminal = request ? isServiceRequestTerminal(request.status) : false;
  const nextStatus = request ? STATUS_TRANSITIONS[request.status] : undefined;

  const handleEdit = () => {
    if (!request) return;
    haptics.light();
    setEditTitleVisible(true);
  };

  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    haptics.light();
    addComment.mutate(
      { serviceRequestId: id, content: trimmed },
      { onSuccess: () => setCommentText('') },
    );
  };

  const uploadAttachmentFromUri = async (uri: string) => {
    const fileName = uri.split('/').pop() ?? 'adjunto.jpg';
    setIsUploadingAttachment(true);
    try {
      const url = await uploadFile.mutateAsync({ uri, folder: 'service-requests' });
      await addAttachments.mutateAsync({
        serviceRequestId: id,
        attachments: [{ url, fileName }],
      });
      haptics.success();
    } catch {
      Alert.alert('Error', 'No se pudo subir el archivo.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleAddAttachment = () => {
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
  };

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Stack.Screen
          options={{ headerShown: true, title: 'Solicitud', headerBackTitle: 'Volver' }}
        />
        <Spinner size="large" color={COLORS.primary} label="Cargando solicitud" />
      </View>
    );
  }

  if (error && !request) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{ headerShown: true, title: 'Solicitud', headerBackTitle: 'Volver' }}
        />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  if (!request) {
    return (
      <View className="bg-background flex-1">
        <Stack.Screen
          options={{ headerShown: true, title: 'Solicitud', headerBackTitle: 'Volver' }}
        />
        <EmptyState title="No encontrada" message="La solicitud no existe o fue eliminada." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-background flex-1"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Solicitud',
          headerBackTitle: 'Volver',
          ...defaultScreenOptions,
        }}
      />

      <Animated.ScrollView
        keyboardShouldPersistTaps="handled"
        style={contentStyle}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
      >
        <ServiceRequestInfoCard
          request={request}
          isClient={isClient}
          isEditPending={editRequest.isPending}
          onEdit={handleEdit}
        />

        {/* Client: Awaiting review hint */}
        {isClient && request.status === ServiceStatus.OPEN && (
          <View className="bg-muted/40 mb-4 rounded-xl p-3">
            <Text style={TYPE.bodySm} className="text-muted-foreground">
              Tu solicitud fue recibida. El equipo de EPDE la revisará y te notificará cuando haya
              novedades.
            </Text>
          </View>
        )}

        {/* Admin: Status transition + Generate budget */}
        {isAdmin && nextStatus && (
          <ServiceRequestStatusActions
            nextStatus={nextStatus}
            statusNote={statusNote}
            onStatusNoteChange={setStatusNote}
            isUpdatePending={updateStatus.isPending}
            isTerminal={isTerminal}
            onUpdateStatus={(status, note) => {
              updateStatus.mutate({ id, status, note }, { onSuccess: () => setStatusNote('') });
            }}
            onCreateBudget={() => setCreateBudgetVisible(true)}
          />
        )}

        <ServiceRequestPhotos
          photos={request.photos}
          previewPhoto={previewPhoto}
          onPreview={setPreviewPhoto}
        />

        <ServiceRequestAttachments
          attachments={request.attachments}
          isTerminal={isTerminal}
          isUploading={isUploadingAttachment}
          onAddAttachment={handleAddAttachment}
        />

        <ServiceRequestComments
          comments={comments}
          commentText={commentText}
          onCommentTextChange={setCommentText}
          onAddComment={handleAddComment}
          isAddPending={addComment.isPending}
          isTerminal={isTerminal}
        />

        <ServiceRequestTimeline auditLog={auditLog} />
      </Animated.ScrollView>

      <EditServiceRequestModal
        visible={editTitleVisible}
        defaultTitle={request.title}
        defaultDescription={request.description}
        defaultUrgency={request.urgency as ServiceUrgency}
        onSubmit={({ title, description, urgency }) =>
          editRequest.mutate({ id, title, description, urgency })
        }
        onClose={() => setEditTitleVisible(false)}
      />

      <CreateBudgetModal
        visible={createBudgetVisible}
        onClose={() => setCreateBudgetVisible(false)}
        defaultPropertyId={request.propertyId}
        defaultTitle={`Presupuesto: ${request.title}`}
        defaultDescription={request.description}
      />
    </KeyboardAvoidingView>
  );
}
