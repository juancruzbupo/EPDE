import type { ServiceRequestPublic } from '@epde/shared';
import { ServiceStatus } from '@epde/shared';
import { Pressable, Text, View } from 'react-native';

import { ServiceStatusBadge, UrgencyBadge } from '@/components/status-badge';
import { formatDateES } from '@/lib/date-format';
import { TYPE } from '@/lib/fonts';

interface ServiceRequestInfoCardProps {
  request: ServiceRequestPublic;
  isClient: boolean;
  isEditPending: boolean;
  onEdit: () => void;
}

export function ServiceRequestInfoCard({
  request,
  isClient,
  isEditPending,
  onEdit,
}: ServiceRequestInfoCardProps) {
  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text
          style={TYPE.titleLg}
          className="text-foreground flex-1"
          ellipsizeMode="tail"
          numberOfLines={2}
        >
          {request.title}
        </Text>
      </View>

      <View className="mb-3 flex-row flex-wrap items-center gap-2">
        <ServiceStatusBadge status={request.status} />
        <UrgencyBadge urgency={request.urgency} />
      </View>

      <Text style={TYPE.bodyMd} className="text-foreground mb-3">
        {request.description}
      </Text>

      <View className="gap-2">
        <View className="flex-row justify-between gap-2">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Propiedad
          </Text>
          <Text
            style={TYPE.labelLg}
            className="text-foreground flex-1 flex-shrink text-right"
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {request.property.address}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Fecha
          </Text>
          <Text style={TYPE.labelLg} className="text-foreground">
            {formatDateES(new Date(request.createdAt))}
          </Text>
        </View>
        {request.task && (
          <View className="flex-row justify-between gap-2">
            <Text style={TYPE.bodyMd} className="text-muted-foreground">
              Tarea
            </Text>
            <Text
              style={TYPE.labelLg}
              className="text-foreground flex-1 flex-shrink text-right"
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {request.task.category.name} — {request.task.name}
            </Text>
          </View>
        )}
      </View>

      {/* Client: Edit button for OPEN status */}
      {isClient && request.status === ServiceStatus.OPEN && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar solicitud"
          onPress={onEdit}
          disabled={isEditPending}
          className="bg-primary mt-3 items-center rounded-lg py-2"
        >
          <Text style={TYPE.labelLg} className="text-primary-foreground">
            Editar
          </Text>
        </Pressable>
      )}
    </View>
  );
}
