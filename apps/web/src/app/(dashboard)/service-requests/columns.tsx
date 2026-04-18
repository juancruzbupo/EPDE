'use client';

import {
  formatRelativeDate,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_VARIANT,
  SERVICE_URGENCY_HINTS,
  SERVICE_URGENCY_LABELS,
  URGENCY_VARIANT,
} from '@epde/shared';
import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { ServiceRequestPublic } from '@/lib/api/service-requests';
import { ROUTES } from '@/lib/routes';

export const serviceRequestColumns: ColumnDef<ServiceRequestPublic>[] = [
  {
    accessorKey: 'title',
    header: 'Título',
    cell: ({ row }) => (
      <Link href={ROUTES.serviceRequest(row.original.id)} className="font-medium hover:underline">
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
        <Badge
          variant={URGENCY_VARIANT[urgency] ?? 'secondary'}
          title={SERVICE_URGENCY_HINTS[urgency]}
        >
          {SERVICE_URGENCY_LABELS[urgency] ?? urgency}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={SERVICE_STATUS_VARIANT[row.original.status] ?? 'secondary'}>
        {SERVICE_STATUS_LABELS[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  {
    id: 'requester',
    header: 'Solicitante',
    cell: ({ row }) => row.original.requester.name,
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }) => formatRelativeDate(new Date(row.original.createdAt)),
  },
];
