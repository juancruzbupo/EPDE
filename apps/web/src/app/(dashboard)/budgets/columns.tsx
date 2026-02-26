'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { BUDGET_STATUS_LABELS } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { budgetStatusVariant, budgetStatusClassName } from '@/lib/style-maps';
import type { BudgetRequestPublic } from '@/lib/api/budgets';

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
          variant={budgetStatusVariant[status] ?? 'outline'}
          className={budgetStatusClassName[status] ?? ''}
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
      }).format(Number(response.totalAmount));
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
