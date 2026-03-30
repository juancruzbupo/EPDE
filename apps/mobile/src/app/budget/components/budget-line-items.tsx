import type { BudgetLineItemPublic } from '@epde/shared';
import { formatARS } from '@epde/shared';
import React from 'react';
import { Text, View } from 'react-native';

import { formatDateES } from '@/lib/date-format';
import { TYPE } from '@/lib/fonts';

function LineItem({ item }: { item: BudgetLineItemPublic }) {
  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between">
        <Text
          style={TYPE.labelLg}
          className="text-foreground flex-1"
          ellipsizeMode="tail"
          numberOfLines={2}
        >
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

interface BudgetLineItemsProps {
  lineItems: BudgetLineItemPublic[];
  totalAmount: number | string;
  estimatedDays: number | null | undefined;
  validUntil: string | null | undefined;
  notes: string | null | undefined;
}

export const BudgetLineItems = React.memo(function BudgetLineItems({
  lineItems,
  totalAmount,
  estimatedDays,
  validUntil,
  notes,
}: BudgetLineItemsProps) {
  return (
    <>
      <Text style={TYPE.titleMd} className="text-foreground mb-2">
        Cotización
      </Text>
      <View className="border-border bg-card mb-4 rounded-xl border px-4">
        {lineItems.map((item) => (
          <LineItem key={item.id} item={item} />
        ))}
        <View className="py-3">
          <View className="flex-row items-center justify-between">
            <Text style={TYPE.titleMd} className="text-foreground">
              Total
            </Text>
            <Text style={TYPE.titleMd} className="text-primary">
              {formatARS(totalAmount)}
            </Text>
          </View>
        </View>
      </View>

      <View className="border-border bg-card mb-4 rounded-xl border p-4">
        <View className="gap-2">
          {estimatedDays && (
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Días estimados
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {estimatedDays} días
              </Text>
            </View>
          )}
          {validUntil && (
            <View className="flex-row justify-between">
              <Text style={TYPE.bodyMd} className="text-muted-foreground">
                Válido hasta
              </Text>
              <Text style={TYPE.labelLg} className="text-foreground">
                {formatDateES(new Date(validUntil))}
              </Text>
            </View>
          )}
          {notes && (
            <View className="mt-1">
              <Text style={TYPE.bodyMd} className="text-muted-foreground mb-1">
                Notas
              </Text>
              <Text style={TYPE.bodyMd} className="text-foreground">
                {notes}
              </Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
});
