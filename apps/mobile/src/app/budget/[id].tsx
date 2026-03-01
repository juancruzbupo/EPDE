import { View, Text, RefreshControl, ActivityIndicator, Pressable, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSlideIn } from '@/lib/animations';
import { haptics } from '@/lib/haptics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBudget, useUpdateBudgetStatus } from '@/hooks/use-budgets';
import { BudgetStatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { TYPE } from '@/lib/fonts';
import type { BudgetLineItemPublic } from '@epde/shared/types';

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
}

function LineItem({ item }: { item: BudgetLineItemPublic }) {
  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between">
        <Text style={TYPE.labelLg} className="text-foreground flex-1" numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={TYPE.titleSm} className="text-foreground ml-2">
          {formatAmount(item.subtotal)}
        </Text>
      </View>
      <Text style={TYPE.bodySm} className="text-muted-foreground mt-1">
        {item.quantity} x {formatAmount(item.unitPrice)}
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
    Alert.alert('Aprobar Presupuesto', 'Estas seguro de que quieres aprobar este presupuesto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: () => updateStatus.mutate({ id, status: 'APPROVED' }),
      },
    ]);
  };

  const handleReject = () => {
    haptics.medium();
    Alert.alert('Rechazar Presupuesto', 'Estas seguro de que quieres rechazar este presupuesto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: () => updateStatus.mutate({ id, status: 'REJECTED' }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <Stack.Screen
          options={{ headerShown: true, title: 'Presupuesto', headerBackTitle: 'Volver' }}
        />
        <ActivityIndicator size="large" color="#c4704b" />
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
          headerStyle: { backgroundColor: '#fafaf8' },
          headerTintColor: '#2e2a27',
          headerTitleStyle: { fontFamily: 'DMSans_700Bold' },
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
              Cotizacion
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
                    {formatAmount(budget.response.totalAmount)}
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
                      Dias estimados
                    </Text>
                    <Text style={TYPE.labelLg} className="text-foreground">
                      {budget.response.estimatedDays} dias
                    </Text>
                  </View>
                )}
                {budget.response.validUntil && (
                  <View className="flex-row justify-between">
                    <Text style={TYPE.bodyMd} className="text-muted-foreground">
                      Valido hasta
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
        {budget.status === 'QUOTED' && (
          <View className="mb-4 flex-row gap-3">
            <Pressable
              onPress={handleApprove}
              disabled={updateStatus.isPending}
              className="flex-1 items-center rounded-xl bg-green-600 py-3"
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
