import type {
  BadgeVariant,
  BudgetStatus,
  PlanStatus,
  PropertyType,
  ServiceStatus,
  ServiceUrgency,
  TaskPriority,
  TaskStatus,
} from '@epde/shared';
import {
  BADGE_VARIANT_CLASSES,
  BUDGET_STATUS_LABELS,
  BUDGET_STATUS_VARIANT,
  PLAN_STATUS_LABELS,
  PLAN_STATUS_VARIANT,
  PRIORITY_VARIANT,
  PROPERTY_TYPE_LABELS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_VARIANT,
  SERVICE_URGENCY_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_VARIANT,
  URGENCY_VARIANT,
} from '@epde/shared';
import { Text, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

/**
 * Derives the container + label classes from the shared BADGE_VARIANT_CLASSES
 * table. Any new BadgeVariant must be declared in shared (see the satisfies
 * guard there) — this component auto-picks it up without a manual sync step.
 */
export function StatusBadge({ label, variant = 'default' }: StatusBadgeProps) {
  const { bg, text, border } = BADGE_VARIANT_CLASSES[variant];

  return (
    <View
      className={`rounded-full px-2.5 py-0.5 ${bg} ${border}`.trim()}
      accessibilityLabel={label}
      accessibilityRole="text"
    >
      <Text style={TYPE.labelMd} className={text}>
        {label}
      </Text>
    </View>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const label = TASK_STATUS_LABELS[status] ?? status;
  const variant = TASK_STATUS_VARIANT[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const label = TASK_PRIORITY_LABELS[priority] ?? priority;
  const variant = PRIORITY_VARIANT[priority] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function PropertyTypeBadge({ type }: { type: PropertyType }) {
  const label = PROPERTY_TYPE_LABELS[type] ?? type;
  return <StatusBadge label={label} variant="secondary" />;
}

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const label = BUDGET_STATUS_LABELS[status] ?? status;
  const variant = BUDGET_STATUS_VARIANT[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const label = SERVICE_STATUS_LABELS[status] ?? status;
  const variant = SERVICE_STATUS_VARIANT[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function UrgencyBadge({ urgency }: { urgency: ServiceUrgency }) {
  const label = SERVICE_URGENCY_LABELS[urgency] ?? urgency;
  const variant = URGENCY_VARIANT[urgency] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  const label = PLAN_STATUS_LABELS[status] ?? status;
  const variant = PLAN_STATUS_VARIANT[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}
