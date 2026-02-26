import { View, Text } from 'react-native';

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

const taskStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pendiente', variant: 'secondary' },
  UPCOMING: { label: 'Proxima', variant: 'default' },
  OVERDUE: { label: 'Vencida', variant: 'destructive' },
  COMPLETED: { label: 'Completada', variant: 'success' },
};

const priorityMap: Record<string, { label: string; variant: BadgeVariant }> = {
  LOW: { label: 'Baja', variant: 'outline' },
  MEDIUM: { label: 'Media', variant: 'secondary' },
  HIGH: { label: 'Alta', variant: 'default' },
  URGENT: { label: 'Urgente', variant: 'destructive' },
};

const propertyTypeMap: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Departamento',
  DUPLEX: 'Duplex',
  COUNTRY_HOUSE: 'Casa de campo',
  OTHER: 'Otro',
};

export function TaskStatusBadge({ status }: { status: string }) {
  const config = taskStatusMap[status] ?? { label: status, variant: 'outline' as BadgeVariant };
  return <StatusBadge label={config.label} variant={config.variant} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityMap[priority] ?? { label: priority, variant: 'outline' as BadgeVariant };
  return <StatusBadge label={config.label} variant={config.variant} />;
}

export function PropertyTypeBadge({ type }: { type: string }) {
  const label = propertyTypeMap[type] ?? type;
  return <StatusBadge label={label} variant="secondary" />;
}

const budgetStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pendiente', variant: 'secondary' },
  QUOTED: { label: 'Cotizado', variant: 'default' },
  APPROVED: { label: 'Aprobado', variant: 'success' },
  REJECTED: { label: 'Rechazado', variant: 'destructive' },
  IN_PROGRESS: { label: 'En Progreso', variant: 'default' },
  COMPLETED: { label: 'Completado', variant: 'success' },
};

export function BudgetStatusBadge({ status }: { status: string }) {
  const config = budgetStatusMap[status] ?? { label: status, variant: 'outline' as BadgeVariant };
  return <StatusBadge label={config.label} variant={config.variant} />;
}

const serviceStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  OPEN: { label: 'Abierto', variant: 'default' },
  IN_REVIEW: { label: 'En Revisión', variant: 'secondary' },
  IN_PROGRESS: { label: 'En Progreso', variant: 'default' },
  RESOLVED: { label: 'Resuelto', variant: 'success' },
  CLOSED: { label: 'Cerrado', variant: 'outline' },
};

export function ServiceStatusBadge({ status }: { status: string }) {
  const config = serviceStatusMap[status] ?? { label: status, variant: 'outline' as BadgeVariant };
  return <StatusBadge label={config.label} variant={config.variant} />;
}

const urgencyMap: Record<string, { label: string; variant: BadgeVariant }> = {
  LOW: { label: 'Baja', variant: 'outline' },
  MEDIUM: { label: 'Media', variant: 'secondary' },
  HIGH: { label: 'Alta', variant: 'default' },
  URGENT: { label: 'Urgente', variant: 'destructive' },
};

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const config = urgencyMap[urgency] ?? { label: urgency, variant: 'outline' as BadgeVariant };
  return <StatusBadge label={config.label} variant={config.variant} />;
}
