'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { SERVICE_URGENCY_LABELS, SERVICE_STATUS_LABELS } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { urgencyVariant } from '@/lib/style-maps';
import type { ServiceRequestPublic } from '@/lib/api/service-requests';
import Link from 'next/link';

export const serviceRequestColumns: ColumnDef<ServiceRequestPublic>[] = [
  {
    accessorKey: 'title',
    header: 'Título',
    cell: ({ row }) => (
      <Link href={`/service-requests/${row.original.id}`} className="font-medium hover:underline">
        {row.original.title}
      </Link>
    ),
  },
  {
    id: 'property',
    header: 'Propiedad',
    cell: ({ row }) => (
      <span>
        {row.original.property.address}, {row.original.property.city}
      </span>
    ),
  },
  {
    accessorKey: 'urgency',
    header: 'Urgencia',
    cell: ({ row }) => {
      const urgency = row.original.urgency;
      return (
        <Badge variant={urgencyVariant[urgency] ?? 'outline'} className={undefined}>
          {SERVICE_URGENCY_LABELS[urgency] ?? urgency}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {SERVICE_STATUS_LABELS[row.original.status] ?? row.original.status}
      </Badge>
    ),
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
