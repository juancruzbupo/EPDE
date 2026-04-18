'use client';

import { PLAN_STATUS_LABELS, PLAN_STATUS_VARIANT, PROPERTY_TYPE_LABELS } from '@epde/shared';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { PropertyPublic } from '@/lib/api/properties';
import { ROUTES } from '@/lib/routes';

export function propertyColumns({ isAdmin }: { isAdmin: boolean }): ColumnDef<PropertyPublic>[] {
  const cols: ColumnDef<PropertyPublic>[] = [
    {
      accessorKey: 'address',
      header: 'Dirección',
      cell: ({ row }) => (
        <Link href={ROUTES.property(row.original.id)} className="font-medium hover:underline">
          {row.original.address}
        </Link>
      ),
    },
    { accessorKey: 'city', header: 'Ciudad' },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">
          {PROPERTY_TYPE_LABELS[row.original.type] ?? row.original.type}
        </Badge>
      ),
    },
  ];

  if (isAdmin) {
    cols.push({
      id: 'client',
      header: 'Cliente',
      cell: ({ row }) => row.original.user?.name ?? '—',
    });
  }

  cols.push(
    {
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = row.original.maintenancePlan;
        if (!plan) return <span className="text-muted-foreground">Sin plan</span>;
        return (
          <Badge variant={PLAN_STATUS_VARIANT[plan.status] ?? 'secondary'}>
            {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
          </Badge>
        );
      },
    },
    {
      id: 'isv',
      header: () => <span title="Índice de Salud de la Vivienda (0-100)">ISV</span>,
      cell: ({ row }) => {
        const isv = row.original.latestISV;
        if (!isv) return <span className="text-muted-foreground">—</span>;
        const variant =
          isv.score >= 80
            ? 'success'
            : isv.score >= 60
              ? 'warning'
              : isv.score >= 40
                ? 'caution'
                : 'destructive';
        return (
          <Badge variant={variant}>
            {isv.score} · {isv.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'yearBuilt',
      header: 'Año',
      cell: ({ row }) => row.original.yearBuilt ?? '—',
    },
  );

  return cols;
}
