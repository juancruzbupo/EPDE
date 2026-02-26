import { View, Text } from 'react-native';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  PROPERTY_TYPE_LABELS,
  BUDGET_STATUS_LABELS,
  SERVICE_STATUS_LABELS,
  SERVICE_URGENCY_LABELS,
} from '@epde/shared';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

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

// Variant mappings (UI-specific, not shared)
const taskStatusVariant: Record<string, BadgeVariant> = {
  PENDING: 'secondary',
  UPCOMING: 'default',
  OVERDUE: 'destructive',
  COMPLETED: 'success',
};

const priorityVariant: Record<string, BadgeVariant> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  URGENT: 'destructive',
};

const budgetStatusVariant: Record<string, BadgeVariant> = {
  PENDING: 'secondary',
  QUOTED: 'default',
  APPROVED: 'success',
  REJECTED: 'destructive',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
};

const serviceStatusVariant: Record<string, BadgeVariant> = {
  OPEN: 'default',
  IN_REVIEW: 'secondary',
  IN_PROGRESS: 'default',
  RESOLVED: 'success',
  CLOSED: 'outline',
};

const urgencyVariant: Record<string, BadgeVariant> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  URGENT: 'destructive',
};

export function TaskStatusBadge({ status }: { status: string }) {
  const label = TASK_STATUS_LABELS[status] ?? status;
  const variant = taskStatusVariant[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const label = TASK_PRIORITY_LABELS[priority] ?? priority;
  const variant = priorityVariant[priority] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function PropertyTypeBadge({ type }: { type: string }) {
  const label = PROPERTY_TYPE_LABELS[type] ?? type;
  return <StatusBadge label={label} variant="secondary" />;
}

export function BudgetStatusBadge({ status }: { status: string }) {
  const label = BUDGET_STATUS_LABELS[status] ?? status;
  const variant = budgetStatusVariant[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function ServiceStatusBadge({ status }: { status: string }) {
  const label = SERVICE_STATUS_LABELS[status] ?? status;
  const variant = serviceStatusVariant[status] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const label = SERVICE_URGENCY_LABELS[urgency] ?? urgency;
  const variant = urgencyVariant[urgency] ?? 'outline';
  return <StatusBadge label={label} variant={variant} />;
}
