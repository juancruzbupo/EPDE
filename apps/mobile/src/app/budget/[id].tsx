import type {
  BudgetAttachmentPublic,
  BudgetAuditLogPublic,
  BudgetCommentPublic,
  BudgetLineItemPublic,
} from '@epde/shared';
import { BudgetStatus, formatARS, formatRelativeDate, isBudgetTerminal } from '@epde/shared';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { BudgetStatusBadge } from '@/components/status-badge';
import {
  useAddBudgetComment,
  useBudget,
  useBudgetAuditLog,
  useBudgetComments,
  useEditBudgetRequest,
  useUpdateBudgetStatus,
} from '@/hooks/use-budgets';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { defaultScreenOptions } from '@/lib/screen-options';

// ─── Sub-components ─────────────────────────────────────────

function LineItem({ item }: { item: BudgetLineItemPublic }) {
  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between">
        <Text style={TYPE.labelLg} className="text-foreground flex-1" numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={TYPE.titleSm} className="text-foreground ml-2">
          {formatARS(item.subtotal)}
        </Text>
      </View>
      <Text style={TYPE.bodySm} className="text-muted-foreground mt-1">
        {item.quantity} x {formatARS(item.unitPrice)}
      </Text>
    </View>
  );
}

function AuditLogEntry({ entry }: { entry: BudgetAuditLogPublic }) {
  const ACTION_LABELS: Record<string, string> = {
    created: 'Creó el presupuesto',
    edited: 'Editó el presupuesto',
    quoted: 'Envió cotización',
    're-quoted': 'Re-cotizó',
    approved: 'Aprobó',
    rejected: 'Rechazó',
    'in-progress': 'Marcó en progreso',
    completed: 'Completó',
    expired: 'Expiró',
  };

  return (
    <View className="border-border border-b py-2">
      <Text style={TYPE.labelMd} className="text-foreground">
        {ACTION_LABELS[entry.action] ?? entry.action}
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {entry.user.name} · {formatRelativeDate(new Date(entry.changedAt))}
      </Text>
    </View>
  );
}

function CommentItem({ comment }: { comment: BudgetCommentPublic }) {
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

function AttachmentItem({ attachment }: { attachment: BudgetAttachmentPublic }) {
  return (
    <Pressable
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

// ─── Edit Budget Modal ──────────────────────────────────────

interface EditBudgetModalProps {
  visible: boolean;
  defaultTitle: string;
  defaultDescription: string | null;
  onSubmit: (data: { title: string; description: string | null }) => void;
  onClose: () => void;
}

function EditBudgetModal({
  visible,
  defaultTitle,
  defaultDescription,
  onSubmit,
  onClose,
}: EditBudgetModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription ?? '');

  useEffect(() => {
    if (visible) {
      setTitle(defaultTitle);
      setDescription(defaultDescription ?? '');
    }
  }, [visible, defaultTitle, defaultDescription]);

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit({
      title: trimmedTitle,
      description: description.trim() || null,
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
                  Editar Presupuesto
                </Text>

                <Text style={TYPE.labelMd} className="text-foreground mb-1">
                  Título
                </Text>
                <TextInput
                  style={TYPE.bodyMd}
                  className="border-border text-foreground mb-3 rounded-lg border px-3 py-2.5"
                  placeholder="Título del presupuesto"
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
                  className="border-border text-foreground mb-4 rounded-lg border px-3 py-2.5"
                  placeholder="Descripción (opcional)"
                  placeholderTextColor={COLORS.mutedForeground}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

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

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: budget, isLoading, error, refetch } = useBudget(id);
  const contentStyle = useSlideIn('bottom');
  const updateStatus = useUpdateBudgetStatus();
  const editBudget = useEditBudgetRequest();
  const { data: auditLog } = useBudgetAuditLog(id);
  const { data: comments } = useBudgetComments(id);
  const addComment = useAddBudgetComment();

  const [commentText, setCommentText] = useState('');
  const [editTitleVisible, setEditTitleVisible] = useState(false);

  const isTerminal = budget ? isBudgetTerminal(budget.status) : false;

  const handleApprove = () => {
    haptics.medium();
    Alert.alert('Aprobar Presupuesto', '¿Estás seguro de que querés aprobar este presupuesto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: () => updateStatus.mutate({ id, status: BudgetStatus.APPROVED }),
      },
    ]);
  };

  const handleReject = () => {
    haptics.medium();
    Alert.alert('Rechazar Presupuesto', '¿Estás seguro de que querés rechazar este presupuesto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: () => updateStatus.mutate({ id, status: BudgetStatus.REJECTED }),
      },
    ]);
  };

  const handleEdit = () => {
    if (!budget) return;
    haptics.light();
    setEditTitleVisible(true);
  };

  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    haptics.light();
    addComment.mutate({ budgetId: id, content: trimmed }, { onSuccess: () => setCommentText('') });
  };

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
        {/* Budget info card */}
        <View className="border-border bg-card mb-4 rounded-xl border p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text style={TYPE.titleLg} className="text-foreground flex-1" numberOfLines={2}>
              {budget.title}
            </Text>
            <BudgetStatusBadge status={budget.status} />
          </View>

          {budget.description && (
            <Text style={TYPE.bodyMd} className="text-muted-foreground mb-3">
              {budget.description}
            </Text>
          )}

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Propiedad
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {budget.property.address}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Fecha
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {format(new Date(budget.createdAt), 'd MMM yyyy', { locale: es })}
              </Text>
            </View>
          </View>

          {/* Edit button for PENDING status */}
          {budget.status === BudgetStatus.PENDING && (
            <Pressable
              onPress={handleEdit}
              disabled={editBudget.isPending}
              className="bg-primary mt-3 items-center rounded-lg py-2"
            >
              <Text style={TYPE.labelLg} className="text-primary-foreground">
                Editar
              </Text>
            </Pressable>
          )}
        </View>

        {/* Quote response card */}
        {budget.response && (
          <>
            <Text style={TYPE.titleMd} className="text-foreground mb-2">
              Cotización
            </Text>
            <View className="border-border bg-card mb-4 rounded-xl border px-4">
              {budget.lineItems.map((item) => (
                <LineItem key={item.id} item={item} />
              ))}
              <View className="py-3">
                <View className="flex-row items-center justify-between">
                  <Text style={TYPE.titleMd} className="text-foreground">
                    Total
                  </Text>
                  <Text style={TYPE.titleMd} className="text-primary">
                    {formatARS(budget.response.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quote details */}
            <View className="border-border bg-card mb-4 rounded-xl border p-4">
              <View className="gap-2">
                {budget.response.estimatedDays && (
                  <View className="flex-row justify-between">
                    <Text style={TYPE.bodyMd} className="text-muted-foreground">
                      Días estimados
                    </Text>
                    <Text style={TYPE.labelLg} className="text-foreground">
                      {budget.response.estimatedDays} días
                    </Text>
                  </View>
                )}
                {budget.response.validUntil && (
                  <View className="flex-row justify-between">
                    <Text style={TYPE.bodyMd} className="text-muted-foreground">
                      Válido hasta
                    </Text>
                    <Text style={TYPE.labelLg} className="text-foreground">
                      {format(new Date(budget.response.validUntil), 'd MMM yyyy', { locale: es })}
                    </Text>
                  </View>
                )}
                {budget.response.notes && (
                  <View className="mt-1">
                    <Text style={TYPE.bodyMd} className="text-muted-foreground mb-1">
                      Notas
                    </Text>
                    <Text style={TYPE.bodyMd} className="text-foreground">
                      {budget.response.notes}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Action buttons for QUOTED status */}
        {budget.status === BudgetStatus.QUOTED && (
          <View className="mb-4 flex-row gap-3">
            <Pressable
              onPress={handleApprove}
              disabled={updateStatus.isPending}
              className="bg-success flex-1 items-center rounded-xl py-3"
            >
              <Text style={TYPE.titleMd} className="text-white">
                Aprobar
              </Text>
            </Pressable>
            <Pressable
              onPress={handleReject}
              disabled={updateStatus.isPending}
              className="bg-destructive flex-1 items-center rounded-xl py-3"
            >
              <Text style={TYPE.titleMd} className="text-destructive-foreground">
                Rechazar
              </Text>
            </Pressable>
          </View>
        )}

        {/* Attachments */}
        {budget.attachments && budget.attachments.length > 0 && (
          <CollapsibleSection title="Adjuntos" count={budget.attachments.length}>
            <View className="border-border bg-card rounded-xl border px-3">
              {budget.attachments.map((att) => (
                <AttachmentItem key={att.id} attachment={att} />
              ))}
            </View>
          </CollapsibleSection>
        )}

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

      <EditBudgetModal
        visible={editTitleVisible}
        defaultTitle={budget.title}
        defaultDescription={budget.description ?? null}
        onSubmit={({ title, description }) => editBudget.mutate({ id, title, description })}
        onClose={() => setEditTitleVisible(false)}
      />
    </View>
  );
}
