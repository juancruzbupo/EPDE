import type { BudgetLineItemPublic } from '@epde/shared';
import { BudgetStatus, formatARS } from '@epde/shared';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { BudgetStatusBadge } from '@/components/status-badge';
import { useBudget, useUpdateBudgetStatus } from '@/hooks/use-budgets';
import { useSlideIn } from '@/lib/animations';
import { colors } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { defaultScreenOptions } from '@/lib/screen-options';

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

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: budget, isLoading, error, refetch } = useBudget(id);
  const contentStyle = useSlideIn('bottom');
  const updateStatus = useUpdateBudgetStatus();

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

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Stack.Screen
          options={{ headerShown: true, title: 'Presupuesto', headerBackTitle: 'Volver' }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
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
      </Animated.ScrollView>
    </View>
  );
}
