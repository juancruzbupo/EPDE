import type { BudgetLineItemPublic, RespondBudgetInput } from '@epde/shared';
import { formatARS, respondBudgetSchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRespondToBudget } from '@/hooks/use-budgets';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

interface RespondBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  budgetId: string;
  initialLineItems?: BudgetLineItemPublic[];
  initialEstimatedDays?: number | null;
  initialValidUntil?: string | null;
  initialNotes?: string | null;
}

export function RespondBudgetModal({
  visible,
  onClose,
  budgetId,
  initialLineItems,
  initialEstimatedDays,
  initialValidUntil,
  initialNotes,
}: RespondBudgetModalProps) {
  const insets = useSafeAreaInsets();
  const contentStyle = useSlideIn('bottom');
  const respondToBudget = useRespondToBudget();

  const defaultLineItems = useMemo(
    () =>
      initialLineItems?.length
        ? initialLineItems.map((li) => ({
            description: li.description,
            quantity: Number(li.quantity),
            unitPrice: Number(li.unitPrice),
          }))
        : [{ description: '', quantity: 1, unitPrice: 0 }],
    [initialLineItems],
  );

  const { control, handleSubmit, watch, reset } = useForm<RespondBudgetInput>({
    resolver: zodResolver(respondBudgetSchema),
    defaultValues: {
      lineItems: defaultLineItems,
      estimatedDays: initialEstimatedDays ?? undefined,
      validUntil: initialValidUntil ?? undefined,
      notes: initialNotes ?? undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const watchedLineItems = watch('lineItems');

  const total = useMemo(
    () =>
      watchedLineItems?.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + qty * price;
      }, 0) ?? 0,
    [watchedLineItems],
  );

  useEffect(() => {
    if (visible) {
      reset({
        lineItems: defaultLineItems,
        estimatedDays: initialEstimatedDays ?? undefined,
        validUntil: initialValidUntil ?? undefined,
        notes: initialNotes ?? undefined,
      });
    }
  }, [visible, defaultLineItems, initialEstimatedDays, initialValidUntil, initialNotes, reset]);

  const onSubmit = (data: RespondBudgetInput) => {
    respondToBudget.mutate(
      { id: budgetId, ...data },
      {
        onSuccess: () => {
          haptics.success();
          reset();
          onClose();
        },
      },
    );
  };

  const isSubmitting = respondToBudget.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="bg-background flex-1"
      >
        <View
          style={{ paddingTop: insets.top }}
          className="border-border flex-row items-center justify-between border-b px-4 py-3"
        >
          <Pressable accessibilityRole="button" accessibilityLabel="Cancelar" onPress={onClose}>
            <Text style={TYPE.labelLg} className="text-muted-foreground">
              Cancelar
            </Text>
          </Pressable>
          <Text style={TYPE.titleMd} className="text-foreground">
            Cotizar
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar cotización"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text
              style={TYPE.titleMd}
              className={isSubmitting ? 'text-muted-foreground' : 'text-primary'}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Text>
          </Pressable>
        </View>

        <Animated.ScrollView
          style={contentStyle}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Line Items */}
          <Text style={TYPE.titleMd} className="text-foreground mb-3">
            Items
          </Text>

          {fields.map((field, index) => {
            const qty = Number(watchedLineItems?.[index]?.quantity) || 0;
            const price = Number(watchedLineItems?.[index]?.unitPrice) || 0;
            const subtotal = qty * price;

            return (
              <View key={field.id} className="border-border bg-card mb-3 rounded-xl border p-3">
                <Controller
                  control={control}
                  name={`lineItems.${index}.description`}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Descripción del item"
                      placeholderTextColor={COLORS.mutedForeground}
                      style={TYPE.bodyMd}
                      className="text-foreground mb-2"
                    />
                  )}
                />
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text style={TYPE.bodySm} className="text-muted-foreground mb-1">
                      Cant.
                    </Text>
                    <Controller
                      control={control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          value={String(value ?? '')}
                          onChangeText={(v) => onChange(v === '' ? '' : Number(v))}
                          keyboardType="numeric"
                          placeholderTextColor={COLORS.mutedForeground}
                          style={TYPE.bodyMd}
                          className="border-border text-foreground rounded-lg border px-2 py-1.5"
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Text style={TYPE.bodySm} className="text-muted-foreground mb-1">
                      P. Unitario
                    </Text>
                    <Controller
                      control={control}
                      name={`lineItems.${index}.unitPrice`}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          value={String(value ?? '')}
                          onChangeText={(v) => onChange(v === '' ? '' : Number(v))}
                          keyboardType="numeric"
                          placeholderTextColor={COLORS.mutedForeground}
                          style={TYPE.bodyMd}
                          className="border-border text-foreground rounded-lg border px-2 py-1.5"
                        />
                      )}
                    />
                  </View>
                  <View className="items-end">
                    <Text style={TYPE.bodySm} className="text-muted-foreground mb-1">
                      Subtotal
                    </Text>
                    <Text style={TYPE.labelLg} className="text-foreground py-1.5">
                      {formatARS(subtotal)}
                    </Text>
                  </View>
                </View>
                {fields.length > 1 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar item"
                    onPress={() => remove(index)}
                    className="mt-2 self-end"
                  >
                    <Text style={TYPE.labelSm} className="text-destructive">
                      Eliminar
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}

          <View className="mb-4 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Agregar item"
              onPress={() => append({ description: '', quantity: 1, unitPrice: 0 })}
              className="border-border rounded-lg border px-3 py-2"
            >
              <Text style={TYPE.labelMd} className="text-primary">
                + Agregar item
              </Text>
            </Pressable>
            <Text style={TYPE.titleMd} className="text-foreground">
              Total: {formatARS(total)}
            </Text>
          </View>

          {/* Conditions */}
          <Text style={TYPE.titleMd} className="text-foreground mb-3">
            Condiciones
          </Text>

          <View className="mb-3 flex-row gap-3">
            <View className="flex-1">
              <Text style={TYPE.labelMd} className="text-foreground mb-1">
                Días estimados
              </Text>
              <Controller
                control={control}
                name="estimatedDays"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value != null ? String(value) : ''}
                    onChangeText={(v) => onChange(v === '' ? undefined : Number(v))}
                    keyboardType="numeric"
                    placeholder="Ej: 5"
                    placeholderTextColor={COLORS.mutedForeground}
                    style={TYPE.bodyMd}
                    className="border-border text-foreground rounded-lg border px-3 py-2.5"
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Text style={TYPE.labelMd} className="text-foreground mb-1">
                Válido hasta
              </Text>
              <Controller
                control={control}
                name="validUntil"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value ?? ''}
                    onChangeText={(v) => onChange(v || undefined)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.mutedForeground}
                    style={TYPE.bodyMd}
                    className="border-border text-foreground rounded-lg border px-3 py-2.5"
                  />
                )}
              />
            </View>
          </View>

          <Text style={TYPE.labelMd} className="text-foreground mb-1">
            Notas
          </Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value ?? ''}
                onChangeText={(v) => onChange(v || undefined)}
                placeholder="Incluye materiales, garantía, etc."
                placeholderTextColor={COLORS.mutedForeground}
                multiline
                style={[TYPE.bodyMd, { minHeight: 60, textAlignVertical: 'top' }]}
                className="border-border text-foreground rounded-lg border px-3 py-2.5"
              />
            )}
          />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
