import { View, Text } from 'react-native';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  PROPERTY_TYPE_LABELS,
  BUDGET_STATUS_LABELS,
  SERVICE_STATUS_LABELS,
  SERVICE_URGENCY_LABELS,
  TASK_STATUS_VARIANT,
  PRIORITY_VARIANT,
  BUDGET_STATUS_VARIANT,
  SERVICE_STATUS_VARIANT,
  URGENCY_VARIANT,
} from '@epde/shared';
import type { BadgeVariant } from '@epde/shared';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: 'bg-primary', text: 'text-primary-foreground' },
  secondary: { bg: 'bg-secondary', text: 'text-secondary-foreground' },
  destructive: { bg: 'bg-destructive', text: 'text-destructive-foreground' },
  outline: { bg: 'border-border bg-transparent border', text: 'text-foreground' },
  success: { bg: 'bg-green-100', text: 'text-green-800' },
};

export function StatusBadge({ label, variant = 'default' }: StatusBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View className={`rounded-full px-2.5 py-0.5 ${styles.bg}`}>
      <Text style={{ fontFamily: 'DMSans_500Medium' }} className={`text-xs ${styles.text}`}>
        {label}
      </Text>
    </View>
  );
}

export function TaskStatusBadge({ status }: { status: string }) {
  const label = TASK_STATUS_LABELS[status] ?? status;
  const variant = TASK_STATUS_VARIANT[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const label = TASK_PRIORITY_LABELS[priority] ?? priority;
  const variant = PRIORITY_VARIANT[priority] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function PropertyTypeBadge({ type }: { type: string }) {
  const label = PROPERTY_TYPE_LABELS[type] ?? type;
  return <StatusBadge label={label} variant="secondary" />;
}

export function BudgetStatusBadge({ status }: { status: string }) {
  const label = BUDGET_STATUS_LABELS[status] ?? status;
  const variant = BUDGET_STATUS_VARIANT[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function ServiceStatusBadge({ status }: { status: string }) {
  const label = SERVICE_STATUS_LABELS[status] ?? status;
  const variant = SERVICE_STATUS_VARIANT[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const label = SERVICE_URGENCY_LABELS[urgency] ?? urgency;
  const variant = URGENCY_VARIANT[urgency] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}
