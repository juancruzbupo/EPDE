'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { PROPERTY_TYPE_LABELS } from '@epde/shared';
import type { PropertyPublic } from '@/lib/api/properties';
import Link from 'next/link';

export function propertyColumns({ isAdmin }: { isAdmin: boolean }): ColumnDef<PropertyPublic>[] {
  const cols: ColumnDef<PropertyPublic>[] = [
    {
      accessorKey: 'address',
      header: 'Dirección',
      cell: ({ row }) => (
        <Link href={`/properties/${row.original.id}`} className="font-medium hover:underline">
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

  cols.push({
    accessorKey: 'yearBuilt',
    header: 'Año',
    cell: ({ row }) => row.original.yearBuilt ?? '—',
  });

  return cols;
}
