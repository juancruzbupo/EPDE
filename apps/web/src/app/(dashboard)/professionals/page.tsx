'use client';

import type {
  ProfessionalAvailability,
  ProfessionalPublic,
  ProfessionalSpecialty,
  ProfessionalTier,
} from '@epde/shared';
import {
  PROFESSIONAL_AVAILABILITY_LABELS,
  PROFESSIONAL_SPECIALTY_LABELS,
  PROFESSIONAL_TIER_LABELS,
} from '@epde/shared';
import { HardHat, Plus, SlidersHorizontal, Star, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { useProfessionals } from '@/hooks/use-professionals';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { ROUTES } from '@/lib/routes';

import { professionalColumns } from './columns';
import { CoverageCard } from './coverage-card';
import { CreateProfessionalDialog } from './create-professional-dialog';

const specialtyOptions = Object.entries(PROFESSIONAL_SPECIALTY_LABELS).map(([value, label]) => ({
  value: value as ProfessionalSpecialty,
  label,
}));

const tierOptions = Object.entries(PROFESSIONAL_TIER_LABELS).map(([value, label]) => ({
  value: value as ProfessionalTier,
  label,
}));

const availabilityOptions = Object.entries(PROFESSIONAL_AVAILABILITY_LABELS).map(
  ([value, label]) => ({
    value: value as ProfessionalAvailability,
    label,
  }),
);

function ProfessionalMobileCard({
  pro,
  onClick,
}: {
  pro: ProfessionalPublic;
  onClick: () => void;
}) {
  const primary = pro.specialties.find((s) => s.isPrimary) ?? pro.specialties[0];
  return (
    <button
      onClick={onClick}
      className="bg-card hover:bg-muted/40 hover:border-border/80 w-full space-y-1 rounded-lg border p-3 text-left shadow-xs transition-all active:opacity-60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-snug font-medium">{pro.name}</p>
          {primary && (
            <p className="text-muted-foreground truncate text-xs">
              {PROFESSIONAL_SPECIALTY_LABELS[primary.specialty]}
            </p>
          )}
        </div>
        <Badge
          variant={
            pro.tier === 'A'
              ? 'success'
              : pro.tier === 'B'
                ? 'secondary'
                : pro.tier === 'C'
                  ? 'warning'
                  : 'destructive'
          }
          className="shrink-0 text-xs"
        >
          {pro.tier}
        </Badge>
      </div>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        {pro.stats.ratingAvg !== null && (
          <span className="flex items-center gap-0.5">
            <Star className="text-warning h-3 w-3 fill-current" />
            {pro.stats.ratingAvg.toFixed(1)} ({pro.stats.ratingCount})
          </span>
        )}
        <span>·</span>
        <span>{pro.serviceAreas.slice(0, 2).join(', ')}</span>
      </div>
    </button>
  );
}

export default function ProfessionalsPage() {
  useEffect(() => {
    document.title = 'Profesionales | EPDE';
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [urlParams, setUrlParams] = useUrlFilters();

  const [search, setSearch] = useState(urlParams.get('search') ?? '');
  const [specialty, setSpecialty] = useState(urlParams.get('specialty') ?? 'all');
  const [tier, setTier] = useState(urlParams.get('tier') ?? 'all');
  const [availability, setAvailability] = useState(urlParams.get('availability') ?? 'all');
  const [serviceArea, setServiceArea] = useState(urlParams.get('serviceArea') ?? '');
  const [createOpen, setCreateOpen] = useState(searchParams.get('action') === 'create');

  const debouncedSearch = useDebounce(search, 300);
  const debouncedArea = useDebounce(serviceArea, 300);

  useEffect(() => {
    const params: Record<string, string | undefined> = {
      search: debouncedSearch || undefined,
      specialty: specialty !== 'all' ? specialty : undefined,
      tier: tier !== 'all' ? tier : undefined,
      availability: availability !== 'all' ? availability : undefined,
      serviceArea: debouncedArea || undefined,
    };
    setUrlParams(params);
  }, [debouncedSearch, specialty, tier, availability, debouncedArea, setUrlParams]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      specialty: specialty !== 'all' ? (specialty as ProfessionalSpecialty) : undefined,
      tier: tier !== 'all' ? (tier as ProfessionalTier) : undefined,
      availability: availability !== 'all' ? (availability as ProfessionalAvailability) : undefined,
      serviceArea: debouncedArea || undefined,
      take: 20,
    }),
    [debouncedSearch, specialty, tier, availability, debouncedArea],
  );

  const { data, isLoading, isError, fetchNextPage, hasNextPage, refetch } =
    useProfessionals(filters);

  const professionals = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const hasActiveFilters =
    !!debouncedSearch ||
    specialty !== 'all' ||
    tier !== 'all' ||
    availability !== 'all' ||
    !!debouncedArea;

  const clearFilters = () => {
    setSearch('');
    setSpecialty('all');
    setTier('all');
    setAvailability('all');
    setServiceArea('');
  };

  if (isError) {
    return <ErrorState message="No se pudieron cargar los profesionales" onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <PageHeader
        title="Profesionales"
        description="Directorio de profesionales matriculados. Asigná SRs, registrá pagos y valoraciones."
        action={
          <Button onClick={() => setCreateOpen(true)} data-tour="new-professional">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo profesional
          </Button>
        }
      />

      <CoverageCard />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, email o matrícula..."
          className="flex-1"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las especialidades</SelectItem>
              {specialtyOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tiers</SelectItem>
              {tierOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Disponibilidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda disponibilidad</SelectItem>
              {availabilityOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="Zona (ej. Paraná Centro)"
            className="border-border bg-background text-foreground placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm sm:w-[140px]"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs">
          <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
          <span>
            {total} resultado{total === 1 ? '' : 's'}
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Limpiar filtros
          </Button>
        </div>
      )}

      {!isLoading && professionals.length === 0 && !hasActiveFilters && (
        <div className="bg-muted/20 rounded-xl border p-8 text-center">
          <HardHat className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
          <h3 className="type-title-md mb-1">Sin profesionales cargados</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Cargá tus electricistas, plomeros y arquitectos para empezar a asignarles servicios.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Cargar primer profesional
          </Button>
        </div>
      )}

      {!isLoading && professionals.length === 0 && hasActiveFilters && (
        <div className="bg-muted/20 rounded-xl border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Ningún profesional coincide con los filtros aplicados.
          </p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      )}

      {professionals.length > 0 && (
        <>
          <div className="hidden sm:block">
            <DataTable
              columns={professionalColumns}
              data={professionals}
              onRowClick={(row) => router.push(ROUTES.professional(row.id))}
            />
          </div>
          <div className="space-y-2 sm:hidden">
            {professionals.map((pro) => (
              <ProfessionalMobileCard
                key={pro.id}
                pro={pro}
                onClick={() => router.push(ROUTES.professional(pro.id))}
              />
            ))}
          </div>
          {hasNextPage && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => fetchNextPage()}>
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}

      <CreateProfessionalDialog open={createOpen} onOpenChange={setCreateOpen} />
    </PageTransition>
  );
}
