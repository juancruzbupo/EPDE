'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { BUDGET_STATUS_LABELS } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BudgetRequestPublic } from '@/lib/api/budgets';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  QUOTED: 'default',
  APPROVED: 'outline',
  REJECTED: 'destructive',
  IN_PROGRESS: 'default',
  COMPLETED: 'outline',
};

const statusClassName: Record<string, string> = {
  APPROVED: 'text-green-600 border-green-600',
  COMPLETED: 'text-green-600 border-green-600',
};

export const budgetColumns: ColumnDef<BudgetRequestPublic>[] = [
  {
    accessorKey: 'title',
    header: 'Titulo',
  },
  {
    id: 'property',
    header: 'Propiedad',
    cell: ({ row }) => {
      const { address, city } = row.original.property;
      return (
        <span>
          {address}, {city}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={statusVariant[status] ?? 'outline'}
          className={statusClassName[status] ?? ''}
        >
          {BUDGET_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
  },
  {
    id: 'amount',
    header: 'Monto',
    cell: ({ row }) => {
      const response = row.original.response;
      if (!response) return '-';
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(response.totalAmount);
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }) =>
      formatDistanceToNow(new Date(row.original.createdAt), {
        addSuffix: true,
        locale: es,
      }),
  },
];
