import { SERVICE_STATUS_LABELS, ServiceStatus } from '@epde/shared';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

export const STATUS_TRANSITIONS: Partial<Record<ServiceStatus, ServiceStatus>> = {
  [ServiceStatus.OPEN]: ServiceStatus.IN_REVIEW,
  [ServiceStatus.IN_REVIEW]: ServiceStatus.IN_PROGRESS,
  [ServiceStatus.IN_PROGRESS]: ServiceStatus.RESOLVED,
  [ServiceStatus.RESOLVED]: ServiceStatus.CLOSED,
};

const TRANSITION_LABELS: Partial<Record<ServiceStatus, string>> = {
  [ServiceStatus.IN_REVIEW]: 'Pasar a En Revisión',
  [ServiceStatus.IN_PROGRESS]: 'Pasar a En Progreso',
  [ServiceStatus.RESOLVED]: 'Marcar como Resuelto',
  [ServiceStatus.CLOSED]: 'Cerrar solicitud',
};

interface ServiceRequestStatusActionsProps {
  nextStatus: ServiceStatus;
  statusNote: string;
  onStatusNoteChange: (note: string) => void;
  isUpdatePending: boolean;
  isTerminal: boolean;
  onUpdateStatus: (status: ServiceStatus, note: string | undefined) => void;
  onCreateBudget: () => void;
}

export function ServiceRequestStatusActions({
  nextStatus,
  statusNote,
  onStatusNoteChange,
  isUpdatePending,
  isTerminal,
  onUpdateStatus,
  onCreateBudget,
}: ServiceRequestStatusActionsProps) {
  return (
    <>
      <View className="border-border bg-card mb-4 rounded-xl border p-4">
        <TextInput
          value={statusNote}
          onChangeText={onStatusNoteChange}
          placeholder="Nota opcional para el cambio de estado..."
          placeholderTextColor={COLORS.mutedForeground}
          multiline
          style={[TYPE.bodyMd, { maxHeight: 80 }]}
          className="border-border text-foreground mb-3 rounded-lg border px-3 py-2"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={TRANSITION_LABELS[nextStatus]}
          onPress={() => {
            haptics.medium();
            Alert.alert(
              'Cambiar estado',
              `¿Estás seguro de que querés cambiar el estado a "${SERVICE_STATUS_LABELS[nextStatus]}"?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Confirmar',
                  onPress: () => {
                    onUpdateStatus(nextStatus, statusNote.trim() || undefined);
                  },
                },
              ],
            );
          }}
          disabled={isUpdatePending}
          className="bg-primary items-center rounded-xl py-3 active:opacity-80"
        >
          <Text style={TYPE.titleMd} className="text-primary-foreground">
            {TRANSITION_LABELS[nextStatus]}
          </Text>
        </Pressable>
      </View>

      {/* Generate budget button */}
      {!isTerminal && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Generar presupuesto para este servicio"
          onPress={() => {
            haptics.light();
            onCreateBudget();
          }}
          className="border-border mb-4 items-center rounded-xl border py-3"
        >
          <Text style={TYPE.labelLg} className="text-primary">
            Generar presupuesto para este servicio
          </Text>
        </Pressable>
      )}
    </>
  );
}
