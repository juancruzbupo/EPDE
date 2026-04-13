import type { InspectionItemStatus } from '@epde/shared';
import { AlertTriangle, CheckCircle, Circle, Wrench } from 'lucide-react';

export const STATUS_CONFIG: Record<
  InspectionItemStatus,
  {
    label: string;
    icon: typeof CheckCircle;
    color: string;
    variant: 'success' | 'warning' | 'destructive' | 'secondary';
  }
> = {
  PENDING: {
    label: 'Pendiente',
    icon: Circle,
    color: 'text-muted-foreground',
    variant: 'secondary',
  },
  OK: { label: 'OK', icon: CheckCircle, color: 'text-success', variant: 'success' },
  NEEDS_ATTENTION: {
    label: 'Necesita atención',
    icon: AlertTriangle,
    color: 'text-warning',
    variant: 'warning',
  },
  NEEDS_PROFESSIONAL: {
    label: 'Requiere profesional',
    icon: Wrench,
    color: 'text-destructive',
    variant: 'destructive',
  },
};
