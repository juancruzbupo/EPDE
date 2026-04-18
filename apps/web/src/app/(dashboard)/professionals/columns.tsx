'use client';

import type { ProfessionalAvailability, ProfessionalPublic, ProfessionalTier } from '@epde/shared';
import {
  PROFESSIONAL_AVAILABILITY_LABELS,
  PROFESSIONAL_SPECIALTY_LABELS,
  PROFESSIONAL_TIER_LABELS,
} from '@epde/shared';
import type { ColumnDef } from '@tanstack/react-table';
import { Star } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/routes';

const TIER_VARIANT: Record<ProfessionalTier, 'success' | 'secondary' | 'warning' | 'destructive'> =
  {
    A: 'success',
    B: 'secondary',
    C: 'warning',
    BLOCKED: 'destructive',
  };

const AVAILABILITY_VARIANT: Record<ProfessionalAvailability, 'success' | 'warning' | 'secondary'> =
  {
    AVAILABLE: 'success',
    BUSY: 'warning',
    UNAVAILABLE: 'secondary',
  };

export const professionalColumns: ColumnDef<ProfessionalPublic>[] = [
  {
    accessorKey: 'name',
    header: 'Profesional',
    cell: ({ row }) => {
      const pro = row.original;
      const primary = pro.specialties.find((s) => s.isPrimary) ?? pro.specialties[0];
      return (
        <Link href={ROUTES.professional(pro.id)} className="block font-medium hover:underline">
          <div>{pro.name}</div>
          {primary && (
            <div className="text-muted-foreground text-xs">
              {PROFESSIONAL_SPECIALTY_LABELS[primary.specialty]}
            </div>
          )}
        </Link>
      );
    },
  },
  {
    accessorKey: 'serviceAreas',
    header: 'Zonas',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.serviceAreas.slice(0, 2).join(', ')}
        {row.original.serviceAreas.length > 2 ? ` +${row.original.serviceAreas.length - 2}` : ''}
      </span>
    ),
  },
  {
    accessorKey: 'tier',
    header: 'Tier',
    cell: ({ row }) => (
      <Badge variant={TIER_VARIANT[row.original.tier] ?? 'secondary'}>
        {PROFESSIONAL_TIER_LABELS[row.original.tier].split(' — ')[0]}
      </Badge>
    ),
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => {
      const stats = row.original.stats;
      if (stats.ratingAvg === null) {
        return <span className="text-muted-foreground text-xs">Sin valorar</span>;
      }
      return (
        <div className="flex items-center gap-1 text-sm">
          <Star className="text-warning h-3.5 w-3.5 fill-current" />
          <span className="font-medium">{stats.ratingAvg.toFixed(1)}</span>
          <span className="text-muted-foreground text-xs">({stats.ratingCount})</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'availability',
    header: 'Disponibilidad',
    cell: ({ row }) => (
      <Badge variant={AVAILABILITY_VARIANT[row.original.availability] ?? 'secondary'}>
        {PROFESSIONAL_AVAILABILITY_LABELS[row.original.availability]}
      </Badge>
    ),
  },
  {
    accessorKey: 'stats.completedAssignments',
    header: 'Trabajos',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.stats.completedAssignments} completados
      </span>
    ),
  },
];
