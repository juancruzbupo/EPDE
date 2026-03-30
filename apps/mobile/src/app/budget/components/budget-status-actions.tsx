import { BudgetStatus } from '@epde/shared';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

interface BudgetStatusActionsProps {
  status: BudgetStatus;
  isAdmin: boolean;
  isClient: boolean;
  isStatusPending: boolean;
  onApprove: () => void;
  onReject: () => void;
  onStartWork: () => void;
  onMarkCompleted: () => void;
  onQuote: () => void;
}

export const BudgetStatusActions = React.memo(function BudgetStatusActions({
  status,
  isAdmin,
  isClient,
  isStatusPending,
  onApprove,
  onReject,
  onStartWork,
  onMarkCompleted,
  onQuote,
}: BudgetStatusActionsProps) {
  return (
    <>
      {/* Client: Awaiting quote hint */}
      {isClient && status === BudgetStatus.PENDING && (
        <View className="bg-muted/40 mb-4 rounded-xl p-3">
          <Text style={TYPE.bodySm} className="text-muted-foreground">
            Tu solicitud fue recibida. El equipo de EPDE preparará una cotización y te notificará
            cuando esté lista.
          </Text>
        </View>
      )}

      {/* Admin: Cotizar */}
      {isAdmin && status === BudgetStatus.PENDING && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cotizar presupuesto"
          onPress={onQuote}
          className="bg-primary mb-4 items-center rounded-xl py-3 active:opacity-80"
        >
          <Text style={TYPE.titleMd} className="text-primary-foreground">
            Cotizar
          </Text>
        </Pressable>
      )}

      {/* Admin: Re-cotizar */}
      {isAdmin && status === BudgetStatus.QUOTED && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Re-cotizar presupuesto"
          onPress={onQuote}
          className="border-border mb-4 items-center rounded-xl border py-3"
        >
          <Text style={TYPE.titleMd} className="text-foreground">
            Re-cotizar
          </Text>
        </Pressable>
      )}

      {/* Client: Approve / Reject for QUOTED */}
      {isClient && status === BudgetStatus.QUOTED && (
        <View className="mb-4 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aprobar presupuesto"
            onPress={onApprove}
            disabled={isStatusPending}
            className="bg-success flex-1 items-center rounded-xl py-3 active:opacity-80"
          >
            <Text style={TYPE.titleMd} className="text-white">
              Aprobar
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rechazar presupuesto"
            onPress={onReject}
            disabled={isStatusPending}
            className="bg-destructive flex-1 items-center rounded-xl py-3 active:opacity-80"
          >
            <Text style={TYPE.titleMd} className="text-destructive-foreground">
              Rechazar
            </Text>
          </Pressable>
        </View>
      )}

      {/* Admin: Start Work */}
      {isAdmin && status === BudgetStatus.APPROVED && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar trabajo"
          onPress={onStartWork}
          disabled={isStatusPending}
          className="bg-primary mb-4 items-center rounded-xl py-3 active:opacity-80"
        >
          <Text style={TYPE.titleMd} className="text-primary-foreground">
            Iniciar Trabajo
          </Text>
        </Pressable>
      )}

      {/* Admin: Mark Completed */}
      {isAdmin && status === BudgetStatus.IN_PROGRESS && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Marcar completado"
          onPress={onMarkCompleted}
          disabled={isStatusPending}
          className="bg-primary mb-4 items-center rounded-xl py-3 active:opacity-80"
        >
          <Text style={TYPE.titleMd} className="text-primary-foreground">
            Marcar Completado
          </Text>
        </Pressable>
      )}
    </>
  );
});
