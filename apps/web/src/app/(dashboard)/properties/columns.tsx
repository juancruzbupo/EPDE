'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PROPERTY_TYPE_LABELS } from '@epde/shared';
import type { PropertyPublic } from '@/lib/api/properties';
import Link from 'next/link';

export function propertyColumns({ isAdmin }: { isAdmin: boolean }): ColumnDef<PropertyPublic>[] {
  const cols: ColumnDef<PropertyPublic>[] = [
    { accessorKey: 'address', header: 'Dirección' },
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
      accessorKey: 'yearBuilt',
      header: 'Año',
      cell: ({ row }) => row.original.yearBuilt ?? '—',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Más opciones">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/properties/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  );

  return cols;
}
