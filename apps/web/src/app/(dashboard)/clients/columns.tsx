'use client';

import { CLIENT_STATUS_VARIANT, formatRelativeDate, USER_STATUS_LABELS } from '@epde/shared';
import { ColumnDef } from '@tanstack/react-table';
import { MailPlus, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ClientPublic } from '@/lib/api/clients';

export function clientColumns({
  onDelete,
  onReinvite,
}: {
  onDelete: (id: string) => void;
  onReinvite: (id: string) => void;
}): ColumnDef<ClientPublic>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <Link href={`/clients/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => row.original.phone || '—',
    },
    {
      id: 'properties',
      header: 'Propiedades',
      cell: ({ row }) => {
        const count = (row.original as ClientPublic & { _count?: { properties: number } })._count
          ?.properties;
        return count != null ? (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        ) : (
          '—'
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={CLIENT_STATUS_VARIANT[row.original.status] ?? 'secondary'}>
          {USER_STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: 'subscription',
      header: 'Suscripción',
      cell: ({ row }) => {
        const expiresAt = row.original.subscriptionExpiresAt;
        if (!expiresAt) return <span className="text-muted-foreground text-xs">—</span>;
        const daysLeft = Math.ceil(
          (new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60_000),
        );
        if (daysLeft < 0) {
          return <Badge variant="destructive">Expirada</Badge>;
        }
        if (daysLeft <= 7) {
          return <Badge variant="warning">{daysLeft}d restantes</Badge>;
        }
        if (daysLeft <= 30) {
          return <Badge variant="caution">{daysLeft}d restantes</Badge>;
        }
        return <span className="text-success text-xs">{daysLeft}d restantes</span>;
      },
    },
    {
      id: 'lastLogin',
      header: 'Último acceso',
      cell: ({ row }) => {
        const lastLogin = row.original.lastLoginAt;
        if (!lastLogin) return <span className="text-muted-foreground text-xs">Nunca</span>;
        const daysAgo = Math.floor(
          (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24),
        );
        const color =
          daysAgo <= 7 ? 'text-success' : daysAgo <= 30 ? 'text-warning' : 'text-destructive';
        return (
          <span className={`text-xs ${color}`}>{formatRelativeDate(new Date(lastLogin))}</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Creado',
      cell: ({ row }) => formatRelativeDate(new Date(row.original.createdAt)),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Más opciones"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.original.status === 'INVITED' && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onReinvite(row.original.id);
                }}
              >
                <MailPlus className="mr-2 h-4 w-4" />
                Reenviar invitación
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
