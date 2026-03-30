import type { BudgetStatus } from '@epde/shared';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { BudgetStatusBadge } from '@/components/status-badge';
import { formatDateES } from '@/lib/date-format';
import { TYPE } from '@/lib/fonts';

interface BudgetInfoCardProps {
  title: string;
  description: string | null;
  status: BudgetStatus;
  propertyAddress: string;
  createdAt: string;
  showEditButton: boolean;
  editDisabled: boolean;
  onEdit: () => void;
}

export const BudgetInfoCard = React.memo(function BudgetInfoCard({
  title,
  description,
  status,
  propertyAddress,
  createdAt,
  showEditButton,
  editDisabled,
  onEdit,
}: BudgetInfoCardProps) {
  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <View className="mb-2 flex-row items-start justify-between gap-2">
        <Text
          style={TYPE.titleLg}
          className="text-foreground flex-1 flex-shrink"
          ellipsizeMode="tail"
          numberOfLines={2}
        >
          {title}
        </Text>
        <BudgetStatusBadge status={status} />
      </View>

      {description && (
        <Text style={TYPE.bodyMd} className="text-muted-foreground mb-3">
          {description}
        </Text>
      )}

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
            {propertyAddress}
          </Text>
        </View>
        <View className="flex-row justify-between gap-2">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Fecha
          </Text>
          <Text style={TYPE.labelLg} className="text-foreground">
            {formatDateES(new Date(createdAt))}
          </Text>
        </View>
      </View>

      {showEditButton && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar presupuesto"
          onPress={onEdit}
          disabled={editDisabled}
          className="bg-primary mt-3 items-center rounded-lg py-2"
        >
          <Text style={TYPE.labelLg} className="text-primary-foreground">
            Editar
          </Text>
        </Pressable>
      )}
    </View>
  );
});
