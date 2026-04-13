import { TASK_STATUS_LABELS, TaskStatus } from '@epde/shared';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

export type StatusFilter = 'ALL' | typeof TaskStatus.UPCOMING | typeof TaskStatus.OVERDUE;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: TaskStatus.UPCOMING, label: TASK_STATUS_LABELS.UPCOMING },
  { key: TaskStatus.OVERDUE, label: TASK_STATUS_LABELS.OVERDUE },
];

/* ── Status Filter Pills ── */
interface StatusFilterPillsProps {
  statusFilter: StatusFilter;
  onStatusChange: (filter: StatusFilter) => void;
}

export const StatusFilterPills = React.memo(function StatusFilterPills({
  statusFilter,
  onStatusChange,
}: StatusFilterPillsProps) {
  return (
    <View
      className="mb-2 flex-row gap-2"
      accessibilityRole="radiogroup"
      accessibilityLabel="Filtrar por estado"
    >
      {FILTERS.map((f) => (
        <Pressable
          key={f.key}
          accessibilityRole="radio"
          accessibilityState={{ selected: statusFilter === f.key }}
          accessibilityLabel={`Filtrar por ${f.label}`}
          onPress={() => onStatusChange(f.key)}
          style={{ minHeight: 44 }}
          className={`items-center justify-center rounded-full px-3 py-2.5 ${
            statusFilter === f.key ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <Text
            style={TYPE.labelMd}
            className={statusFilter === f.key ? 'text-primary-foreground' : 'text-muted-foreground'}
          >
            {f.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

/* ── Category Filter ── */
interface CategoryOption {
  key: string;
  label: string;
}

interface CategoryFilterProps {
  categoryOptions: CategoryOption[];
  categoryFilter: string | undefined;
  onCategoryChange: (category: string | undefined) => void;
}

export const CategoryFilter = React.memo(function CategoryFilter({
  categoryOptions,
  categoryFilter,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, marginBottom: 16 }}
      accessibilityRole="radiogroup"
      accessibilityLabel="Filtrar por categor\u00eda"
    >
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel="Filtrar por todas las categorías"
        accessibilityState={{ selected: !categoryFilter }}
        onPress={() => {
          haptics.selection();
          onCategoryChange(undefined);
        }}
        style={{ minHeight: 44 }}
        className={`items-center justify-center rounded-full px-3 py-2 ${!categoryFilter ? 'bg-primary' : 'bg-card border-border border'}`}
      >
        <Text
          style={TYPE.labelSm}
          className={!categoryFilter ? 'text-primary-foreground' : 'text-foreground'}
        >
          Todas
        </Text>
      </Pressable>
      {categoryOptions.map((c) => (
        <Pressable
          key={c.key}
          accessibilityRole="radio"
          accessibilityLabel={`Filtrar por ${c.label}`}
          accessibilityState={{ selected: categoryFilter === c.key }}
          onPress={() => {
            haptics.selection();
            onCategoryChange(c.key);
          }}
          style={{ minHeight: 44 }}
          className={`items-center justify-center rounded-full px-3 py-2 ${categoryFilter === c.key ? 'bg-primary' : 'bg-card border-border border'}`}
        >
          <Text
            style={TYPE.labelSm}
            className={categoryFilter === c.key ? 'text-primary-foreground' : 'text-foreground'}
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {c.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
});
