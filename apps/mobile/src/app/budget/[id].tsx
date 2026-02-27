import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBudget, useUpdateBudgetStatus } from '@/hooks/use-budgets';
import { BudgetStatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import type { BudgetLineItemPublic } from '@epde/shared/types';

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
}

function LineItem({ item }: { item: BudgetLineItemPublic }) {
  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between">
        <Text
          style={{ fontFamily: 'DMSans_500Medium' }}
          className="text-foreground flex-1 text-sm"
          numberOfLines={2}
        >
          {item.description}
        </Text>
        <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground ml-2 text-sm">
          {formatAmount(item.subtotal)}
        </Text>
      </View>
      <Text
        style={{ fontFamily: 'DMSans_400Regular' }}
        className="text-muted-foreground mt-1 text-xs"
      >
        {item.quantity} x {formatAmount(item.unitPrice)}
      </Text>
    </View>
  );
}

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: budget, isLoading, error, refetch } = useBudget(id);
  const updateStatus = useUpdateBudgetStatus();

  const handleApprove = () => {
    Alert.alert('Aprobar Presupuesto', 'Estas seguro de que quieres aprobar este presupuesto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: () => updateStatus.mutate({ id, status: 'APPROVED' }),
      },
    ]);
  };

  const handleReject = () => {
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

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />}
      >
        {/* Budget info card */}
        <View className="border-border bg-card mb-4 rounded-xl border p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className="text-foreground flex-1 text-lg"
              numberOfLines={2}
            >
              {budget.title}
            </Text>
            <BudgetStatusBadge status={budget.status} />
          </View>

          {budget.description && (
            <Text
              style={{ fontFamily: 'DMSans_400Regular' }}
              className="text-muted-foreground mb-3 text-sm"
            >
              {budget.description}
            </Text>
          )}

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted-foreground text-sm"
              >
                Propiedad
              </Text>
              <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
                {budget.property.address}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text
                style={{ fontFamily: 'DMSans_400Regular' }}
                className="text-muted-foreground text-sm"
              >
                Fecha
              </Text>
              <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground text-sm">
                {format(new Date(budget.createdAt), 'd MMM yyyy', { locale: es })}
              </Text>
            </View>
          </View>
        </View>

        {/* Quote response card */}
        {budget.response && (
          <>
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className="text-foreground mb-2 text-base"
            >
              Cotizacion
            </Text>
            <View className="border-border bg-card mb-4 rounded-xl border px-4">
              {budget.lineItems.map((item) => (
                <LineItem key={item.id} item={item} />
              ))}
              <View className="py-3">
                <View className="flex-row items-center justify-between">
                  <Text
                    style={{ fontFamily: 'DMSans_700Bold' }}
                    className="text-foreground text-base"
                  >
                    Total
                  </Text>
                  <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-primary text-base">
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
                    <Text
                      style={{ fontFamily: 'DMSans_400Regular' }}
                      className="text-muted-foreground text-sm"
                    >
                      Dias estimados
                    </Text>
                    <Text
                      style={{ fontFamily: 'DMSans_500Medium' }}
                      className="text-foreground text-sm"
                    >
                      {budget.response.estimatedDays} dias
                    </Text>
                  </View>
                )}
                {budget.response.validUntil && (
                  <View className="flex-row justify-between">
                    <Text
                      style={{ fontFamily: 'DMSans_400Regular' }}
                      className="text-muted-foreground text-sm"
                    >
                      Valido hasta
                    </Text>
                    <Text
                      style={{ fontFamily: 'DMSans_500Medium' }}
                      className="text-foreground text-sm"
                    >
                      {format(new Date(budget.response.validUntil), 'd MMM yyyy', { locale: es })}
                    </Text>
                  </View>
                )}
                {budget.response.notes && (
                  <View className="mt-1">
                    <Text
                      style={{ fontFamily: 'DMSans_400Regular' }}
                      className="text-muted-foreground mb-1 text-sm"
                    >
                      Notas
                    </Text>
                    <Text
                      style={{ fontFamily: 'DMSans_400Regular' }}
                      className="text-foreground text-sm"
                    >
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
              <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-base text-white">
                Aprobar
              </Text>
            </Pressable>
            <Pressable
              onPress={handleReject}
              disabled={updateStatus.isPending}
              className="bg-destructive flex-1 items-center rounded-xl py-3"
            >
              <Text
                style={{ fontFamily: 'DMSans_700Bold' }}
                className="text-destructive-foreground text-base"
              >
                Rechazar
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
