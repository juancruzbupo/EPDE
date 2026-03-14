import type {
  ServiceRequestAttachmentPublic,
  ServiceRequestAuditLogPublic,
  ServiceRequestCommentPublic,
} from '@epde/shared';
import { SERVICE_REQUEST_TERMINAL_STATUSES, ServiceStatus } from '@epde/shared';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { CollapsibleSection } from '@/components/collapsible-section';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ServiceStatusBadge, UrgencyBadge } from '@/components/status-badge';
import {
  useAddServiceRequestAttachments,
  useAddServiceRequestComment,
  useEditServiceRequest,
  useServiceRequest,
  useServiceRequestAuditLog,
  useServiceRequestComments,
} from '@/hooks/use-service-requests';
import { useUploadFile } from '@/hooks/use-upload';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { defaultScreenOptions } from '@/lib/screen-options';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ─── Sub-components ─────────────────────────────────────────

function AuditLogEntry({ entry }: { entry: ServiceRequestAuditLogPublic }) {
  const ACTION_LABELS: Record<string, string> = {
    created: 'Creó la solicitud',
    edited: 'Editó la solicitud',
    'in-review': 'Pasó a revisión',
    'in-progress': 'Marcó en progreso',
    resolved: 'Marcó como resuelta',
    closed: 'Cerró la solicitud',
  };

  const note = (entry.after as Record<string, unknown>)?.note as string | undefined;

  return (
    <View className="border-border border-b py-2">
      <Text style={TYPE.labelMd} className="text-foreground">
        {ACTION_LABELS[entry.action] ?? entry.action}
      </Text>
      {note && (
        <Text style={TYPE.bodySm} className="text-foreground mt-0.5 italic">
          {note}
        </Text>
      )}
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {entry.user.name} ·{' '}
        {formatDistanceToNow(new Date(entry.changedAt), { addSuffix: true, locale: es })}
      </Text>
    </View>
  );
}

function CommentItem({ comment }: { comment: ServiceRequestCommentPublic }) {
  return (
    <View className="border-border border-b py-2">
      <View className="flex-row items-center justify-between">
        <Text style={TYPE.labelMd} className="text-foreground">
          {comment.user.name}
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
        </Text>
      </View>
      <Text style={TYPE.bodyMd} className="text-foreground mt-1">
        {comment.content}
      </Text>
    </View>
  );
}

function AttachmentItem({ attachment }: { attachment: ServiceRequestAttachmentPublic }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(attachment.url)}
      className="border-border border-b py-2"
    >
      <Text style={TYPE.labelMd} className="text-primary" numberOfLines={1}>
        {attachment.fileName}
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true, locale: es })}
      </Text>
    </Pressable>
  );
}

// ─── Main Screen ────────────────────────────────────────────

export default function ServiceRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contentStyle = useSlideIn('bottom');
  const { data: request, isLoading, error, refetch } = useServiceRequest(id);
  const editRequest = useEditServiceRequest();
  const { data: auditLog } = useServiceRequestAuditLog(id);
  const { data: comments } = useServiceRequestComments(id);
  const addComment = useAddServiceRequestComment();
  const uploadFile = useUploadFile();
  const addAttachments = useAddServiceRequestAttachments();
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const isTerminal = request
    ? SERVICE_REQUEST_TERMINAL_STATUSES.includes(request.status as never)
    : false;

  const handleEdit = () => {
    if (!request) return;
    haptics.light();
    Alert.prompt(
      'Editar Título',
      'Ingresá el nuevo título:',
      (newTitle) => {
        if (newTitle?.trim()) {
          editRequest.mutate({ id, title: newTitle.trim() });
        }
      },
      'plain-text',
      request.title,
    );
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

  const handleAddAttachment = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const fileName = asset.uri.split('/').pop() ?? 'adjunto.jpg';

    setIsUploadingAttachment(true);
    try {
      const url = await uploadFile.mutateAsync({ uri: asset.uri, folder: 'service-requests' });
      await addAttachments.mutateAsync({
        serviceRequestId: id,
        attachments: [{ url, fileName }],
      });
      haptics.success();
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Stack.Screen
          options={{ headerShown: true, title: 'Solicitud', headerBackTitle: 'Volver' }}
        />
        <ActivityIndicator size="large" color={COLORS.primary} />
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
    <View className="bg-background flex-1">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Solicitud',
          headerBackTitle: 'Volver',
          ...defaultScreenOptions,
        }}
      />

      <Animated.ScrollView
        style={contentStyle}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
      >
        {/* Request info card */}
        <View className="border-border bg-card mb-4 rounded-xl border p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text style={TYPE.titleLg} className="text-foreground flex-1" numberOfLines={2}>
              {request.title}
            </Text>
          </View>

          <View className="mb-3 flex-row items-center gap-2">
            <ServiceStatusBadge status={request.status} />
            <UrgencyBadge urgency={request.urgency} />
          </View>

          <Text style={TYPE.bodyMd} className="text-foreground mb-3">
            {request.description}
          </Text>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Propiedad
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {request.property.address}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Fecha
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {format(new Date(request.createdAt), 'd MMM yyyy', { locale: es })}
              </Text>
            </View>
            {request.task && (
              <View className="flex-row justify-between">
                <Text style={TYPE.bodyMd} className="text-muted-foreground">
                  Tarea
                </Text>
                <Text style={TYPE.labelLg} className="text-foreground" numberOfLines={1}>
                  {request.task.category.name} — {request.task.name}
                </Text>
              </View>
            )}
          </View>

          {/* Edit button for OPEN status */}
          {request.status === ServiceStatus.OPEN && (
            <Pressable
              onPress={handleEdit}
              disabled={editRequest.isPending}
              className="bg-primary mt-3 items-center rounded-lg py-2"
            >
              <Text style={TYPE.labelLg} className="text-primary-foreground">
                Editar
              </Text>
            </Pressable>
          )}
        </View>

        {/* Photos */}
        {request.photos && request.photos.length > 0 && (
          <CollapsibleSection title="Fotos" count={request.photos.length}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {request.photos.map((photo) => (
                <Pressable key={photo.id} onPress={() => setPreviewPhoto(photo.url)}>
                  <Image
                    source={{ uri: photo.url, cache: 'force-cache' }}
                    className="h-32 w-32 rounded-xl"
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </CollapsibleSection>
        )}

        {/* Attachments */}
        <CollapsibleSection title="Adjuntos" count={request.attachments?.length}>
          <View className="border-border bg-card rounded-xl border px-3">
            {request.attachments && request.attachments.length > 0 ? (
              request.attachments.map((att) => <AttachmentItem key={att.id} attachment={att} />)
            ) : (
              <Text style={TYPE.bodyMd} className="text-muted-foreground py-3">
                Sin adjuntos
              </Text>
            )}
          </View>

          {!isTerminal && (
            <Pressable
              onPress={handleAddAttachment}
              disabled={isUploadingAttachment}
              className="bg-primary mt-2 items-center rounded-lg py-2"
            >
              {isUploadingAttachment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={TYPE.labelMd} className="text-primary-foreground">
                  Adjuntar archivo
                </Text>
              )}
            </Pressable>
          )}
        </CollapsibleSection>

        {/* Comments */}
        <CollapsibleSection title="Comentarios" count={comments?.length}>
          <View className="border-border bg-card rounded-xl border px-3">
            {comments && comments.length > 0 ? (
              comments.map((c) => <CommentItem key={c.id} comment={c} />)
            ) : (
              <Text style={TYPE.bodyMd} className="text-muted-foreground py-3">
                Sin comentarios
              </Text>
            )}
          </View>

          {/* Add comment form */}
          {!isTerminal && (
            <View className="mt-2 flex-row items-end gap-2">
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Escribí un comentario..."
                placeholderTextColor={COLORS.mutedForeground}
                multiline
                style={[TYPE.bodyMd, { maxHeight: 80, flex: 1 }]}
                className="border-border bg-card text-foreground rounded-lg border px-3 py-2"
              />
              <Pressable
                onPress={handleAddComment}
                disabled={!commentText.trim() || addComment.isPending}
                className="bg-primary rounded-lg px-4 py-2"
              >
                <Text style={TYPE.labelMd} className="text-primary-foreground">
                  Enviar
                </Text>
              </Pressable>
            </View>
          )}
        </CollapsibleSection>

        {/* Audit log / timeline */}
        <CollapsibleSection title="Historial" count={auditLog?.length} defaultOpen={false}>
          <View className="border-border bg-card rounded-xl border px-3">
            {auditLog && auditLog.length > 0 ? (
              auditLog.map((entry) => <AuditLogEntry key={entry.id} entry={entry} />)
            ) : (
              <Text style={TYPE.bodyMd} className="text-muted-foreground py-3">
                Sin historial
              </Text>
            )}
          </View>
        </CollapsibleSection>
      </Animated.ScrollView>

      {/* Full-screen photo preview */}
      <Modal visible={!!previewPhoto} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/90"
          onPress={() => setPreviewPhoto(null)}
        >
          {previewPhoto && (
            <Image
              source={{ uri: previewPhoto }}
              style={{ width: screenWidth * 0.9, height: screenHeight * 0.7 }}
              resizeMode="contain"
            />
          )}
          <Text style={TYPE.labelLg} className="mt-4 text-white">
            Toca para cerrar
          </Text>
        </Pressable>
      </Modal>
    </View>
  );
}
