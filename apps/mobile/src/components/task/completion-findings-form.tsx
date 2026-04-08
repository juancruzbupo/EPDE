import type { ActionTaken, ConditionFound, TaskExecutor, TaskResult } from '@epde/shared';
import {
  ACTION_TAKEN_LABELS,
  ACTION_TAKEN_VALUES,
  CONDITION_FOUND_HINTS,
  CONDITION_FOUND_LABELS,
  CONDITION_FOUND_VALUES,
  TASK_EXECUTOR_LABELS,
  TASK_EXECUTOR_VALUES,
  TASK_RESULT_LABELS,
  TASK_RESULT_VALUES,
} from '@epde/shared';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

function SelectorGroup<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View className="mb-4" accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={TYPE.labelLg} className="text-foreground mb-2">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <Pressable
              key={opt}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={labels[opt] ?? opt}
              onPress={() => onChange(opt)}
              className={`rounded-lg border px-4 py-2.5 ${
                selected ? 'bg-primary border-primary' : 'border-border bg-card'
              }`}
            >
              <Text
                style={selected ? TYPE.titleSm : TYPE.bodyMd}
                className={selected ? 'text-primary-foreground' : 'text-foreground'}
              >
                {labels[opt] ?? opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface CompletionFindingsFormProps {
  result: TaskResult | null;
  onResultChange: (v: TaskResult) => void;
  conditionFound: ConditionFound | null;
  onConditionFoundChange: (v: ConditionFound) => void;
  executor: TaskExecutor | null;
  onExecutorChange: (v: TaskExecutor) => void;
  actionTaken: ActionTaken | null;
  onActionTakenChange: (v: ActionTaken) => void;
  cost: string;
  onCostChange: (v: string) => void;
  completedAtText: string;
  onCompletedAtTextChange: (v: string) => void;
  note: string;
  onNoteChange: (v: string) => void;
}

export const CompletionFindingsForm = React.memo(function CompletionFindingsForm({
  result,
  onResultChange,
  conditionFound,
  onConditionFoundChange,
  executor,
  onExecutorChange,
  actionTaken,
  onActionTakenChange,
  cost,
  onCostChange,
  completedAtText,
  onCompletedAtTextChange,
  note,
  onNoteChange,
}: CompletionFindingsFormProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      {/* Essential field 1: Condition */}
      <SelectorGroup
        label="¿En qué estado está? *"
        options={CONDITION_FOUND_VALUES}
        labels={CONDITION_FOUND_LABELS}
        value={conditionFound}
        onChange={onConditionFoundChange}
      />
      {conditionFound && (
        <Text style={TYPE.bodySm} className="text-muted-foreground -mt-2 mb-4">
          {CONDITION_FOUND_HINTS[conditionFound]}
        </Text>
      )}

      {/* Essential field 2: Executor */}
      <SelectorGroup
        label="¿Quién lo hizo? *"
        options={TASK_EXECUTOR_VALUES}
        labels={TASK_EXECUTOR_LABELS}
        value={executor}
        onChange={onExecutorChange}
      />

      {/* Toggle details */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={showDetails ? 'Mostrar menos opciones' : 'Mostrar más opciones'}
        onPress={() => setShowDetails(!showDetails)}
        className="mb-4"
      >
        <Text style={TYPE.labelLg} className="text-primary">
          {showDetails ? '▴ Menos detalles' : '▾ Agregar más detalles'}
        </Text>
      </Pressable>

      {showDetails && (
        <>
          <SelectorGroup
            label="Resultado *"
            options={TASK_RESULT_VALUES}
            labels={TASK_RESULT_LABELS}
            value={result}
            onChange={onResultChange}
          />

          <SelectorGroup
            label="Acción realizada *"
            options={ACTION_TAKEN_VALUES}
            labels={ACTION_TAKEN_LABELS}
            value={actionTaken}
            onChange={onActionTakenChange}
          />

          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Costo (opcional)
          </Text>
          <View className="mb-4 flex-row items-center">
            <Text style={TYPE.bodyMd} className="text-muted-foreground mr-2">
              $
            </Text>
            <TextInput
              value={cost}
              onChangeText={onCostChange}
              placeholder="0.00"
              placeholderTextColor={COLORS.mutedForeground}
              keyboardType="decimal-pad"
              style={TYPE.bodyMd}
              className="border-border bg-card text-foreground flex-1 rounded-xl border p-3"
            />
          </View>

          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Fecha de completación (opcional)
          </Text>
          <TextInput
            value={completedAtText}
            onChangeText={onCompletedAtTextChange}
            placeholder="DD/MM/AAAA (hoy por defecto)"
            placeholderTextColor={COLORS.mutedForeground}
            keyboardType="numeric"
            style={TYPE.bodyMd}
            className="border-border bg-card text-foreground mb-4 rounded-xl border p-3"
          />

          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Notas (opcional)
          </Text>
          <TextInput
            value={note}
            onChangeText={onNoteChange}
            placeholder="Describir el trabajo realizado..."
            placeholderTextColor={COLORS.mutedForeground}
            multiline
            maxLength={500}
            style={[TYPE.bodyMd, { minHeight: 80, textAlignVertical: 'top' }]}
            className="border-border bg-card text-foreground mb-4 rounded-xl border p-3"
          />
        </>
      )}
    </>
  );
});
