import type {
  ServiceRequestAttachmentPublic,
  ServiceRequestAuditLogPublic,
  ServiceRequestCommentPublic,
} from '@epde/shared';
import {
  formatRelativeDate,
  isServiceRequestTerminal,
  SERVICE_URGENCY_LABELS,
  ServiceStatus,
  ServiceUrgency,
} from '@epde/shared';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
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
        {entry.user.name} · {formatRelativeDate(new Date(entry.changedAt))}
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
          {formatRelativeDate(new Date(comment.createdAt))}
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
      accessibilityRole="link"
      accessibilityLabel={attachment.fileName}
      onPress={() => Linking.openURL(attachment.url)}
      className="border-border border-b py-2"
    >
      <Text style={TYPE.labelMd} className="text-primary" numberOfLines={1}>
        {attachment.fileName}
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {formatRelativeDate(new Date(attachment.createdAt))}
      </Text>
    </Pressable>
  );
}

// ─── Edit Service Request Modal ─────────────────────────────

const URGENCY_OPTIONS = [
  ServiceUrgency.LOW,
  ServiceUrgency.MEDIUM,
  ServiceUrgency.HIGH,
  ServiceUrgency.URGENT,
] as const;

const URGENCY_COLORS: Record<ServiceUrgency, string> = {
  [ServiceUrgency.LOW]: COLORS.success,
  [ServiceUrgency.MEDIUM]: COLORS.warning,
  [ServiceUrgency.HIGH]: COLORS.caution,
  [ServiceUrgency.URGENT]: COLORS.destructive,
};

interface EditServiceRequestModalProps {
  visible: boolean;
  defaultTitle: string;
  defaultDescription: string;
  defaultUrgency: ServiceUrgency;
  onSubmit: (data: { title: string; description: string; urgency: ServiceUrgency }) => void;
  onClose: () => void;
}

function EditServiceRequestModal({
  visible,
  defaultTitle,
  defaultDescription,
  defaultUrgency,
  onSubmit,
  onClose,
}: EditServiceRequestModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [urgency, setUrgency] = useState<ServiceUrgency>(defaultUrgency);

  useEffect(() => {
    if (visible) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setUrgency(defaultUrgency);
    }
  }, [visible, defaultTitle, defaultDescription, defaultUrgency]);

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      urgency,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              style={{ maxHeight: '80%' }}
            >
              <View className="bg-card mx-8 w-full max-w-sm rounded-2xl p-6">
                <Text style={TYPE.titleMd} className="text-foreground mb-4">
                  Editar Solicitud
                </Text>

                <Text style={TYPE.labelMd} className="text-foreground mb-1">
                  Título
                </Text>
                <TextInput
                  style={TYPE.bodyMd}
                  className="border-border text-foreground mb-3 rounded-lg border px-3 py-2.5"
                  placeholder="Título de la solicitud"
                  placeholderTextColor={COLORS.mutedForeground}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  returnKeyType="next"
                />

                <Text style={TYPE.labelMd} className="text-foreground mb-1">
                  Descripción
                </Text>
                <TextInput
                  style={[TYPE.bodyMd, { minHeight: 80, textAlignVertical: 'top' }]}
                  className="border-border text-foreground mb-3 rounded-lg border px-3 py-2.5"
                  placeholder="Descripción de la solicitud"
                  placeholderTextColor={COLORS.mutedForeground}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

                <Text style={TYPE.labelMd} className="text-foreground mb-2">
                  Urgencia
                </Text>
                <View
                  className="mb-4 flex-row gap-2"
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Urgencia"
                >
                  {URGENCY_OPTIONS.map((opt) => {
                    const isSelected = urgency === opt;
                    return (
                      <Pressable
                        key={opt}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={SERVICE_URGENCY_LABELS[opt]}
                        onPress={() => setUrgency(opt)}
                        className="flex-1 items-center rounded-lg border py-2"
                        style={{
                          borderColor: isSelected ? URGENCY_COLORS[opt] : COLORS.border,
                          backgroundColor: isSelected ? URGENCY_COLORS[opt] + '18' : 'transparent',
                        }}
                      >
                        <Text
                          style={[
                            TYPE.labelSm,
                            { color: isSelected ? URGENCY_COLORS[opt] : COLORS.mutedForeground },
                          ]}
                        >
                          {SERVICE_URGENCY_LABELS[opt]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View className="flex-row justify-end gap-3">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar"
                    onPress={onClose}
                  >
                    <Text style={TYPE.labelLg} className="text-muted-foreground px-3 py-2">
                      Cancelar
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Guardar"
                    onPress={handleSubmit}
                    className="bg-primary rounded-lg px-4 py-2"
                    disabled={!title.trim()}
                  >
                    <Text style={TYPE.labelLg} className="text-primary-foreground">
                      Guardar
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
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
  const [editTitleVisible, setEditTitleVisible] = useState(false);

  const isTerminal = request ? isServiceRequestTerminal(request.status) : false;

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
              accessibilityRole="button"
              accessibilityLabel="Editar solicitud"
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
                <Pressable
                  key={photo.id}
                  accessibilityRole="button"
                  accessibilityLabel="Ver foto"
                  onPress={() => setPreviewPhoto(photo.url)}
                >
                  <Image
                    source={{ uri: photo.url, cache: 'force-cache' }}
                    className="h-32 w-32 rounded-xl"
                    resizeMode="cover"
                    accessibilityLabel="Foto de solicitud de servicio"
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
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adjuntar archivo"
                onPress={handleAddAttachment}
                disabled={isUploadingAttachment}
                className="bg-primary mt-2 items-center rounded-lg py-2"
              >
                {isUploadingAttachment ? (
                  <ActivityIndicator size="small" color={COLORS.primaryForeground} />
                ) : (
                  <Text style={TYPE.labelMd} className="text-primary-foreground">
                    Adjuntar archivo
                  </Text>
                )}
              </Pressable>
              <Text style={TYPE.bodySm} className="text-muted-foreground mt-1 text-center">
                Máx. 10 MB por archivo
              </Text>
            </>
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
                accessibilityRole="button"
                accessibilityLabel="Enviar comentario"
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
