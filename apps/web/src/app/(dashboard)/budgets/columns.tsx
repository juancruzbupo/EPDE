'use client';

import {
  BUDGET_STATUS_HINTS,
  BUDGET_STATUS_LABELS,
  BUDGET_STATUS_VARIANT,
  formatRelativeDate,
} from '@epde/shared';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { BudgetRequestPublic } from '@/lib/api/budgets';
import { ROUTES } from '@/lib/routes';

export const budgetColumns: ColumnDef<BudgetRequestPublic>[] = [
  {
    accessorKey: 'title',
    header: 'Título',
    cell: ({ row }) => (
      <Link href={ROUTES.budget(row.original.id)} className="font-medium hover:underline">
        {row.original.title}
      </Link>
    ),
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
          variant={BUDGET_STATUS_VARIANT[status] ?? 'secondary'}
          title={BUDGET_STATUS_HINTS[status]}
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
      if (!response) return '—';
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(Number(response.totalAmount));
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }) => formatRelativeDate(new Date(row.original.createdAt)),
  },
];
