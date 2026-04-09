'use client';

import type { PropertySector } from '@epde/shared';
import { createPropertySchema, PROPERTY_SECTOR_LABELS, PROPERTY_TYPE_LABELS } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type PropertyFormValues = z.input<typeof createPropertySchema>;
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClientSearch } from '@/hooks/use-clients';
import { useCreateProperty } from '@/hooks/use-properties';
import { cn } from '@/lib/utils';

import { InviteClientDialog } from '../clients/invite-client-dialog';

interface CreatePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePropertyDialog({ open, onOpenChange }: CreatePropertyDialogProps) {
  const router = useRouter();
  const createProperty = useCreateProperty();
  const [clientSearch, setClientSearch] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [selectedClientLabel, setSelectedClientLabel] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [sectors, setSectors] = useState<PropertySector[]>([]);

  const toggleSector = (sector: PropertySector) => {
    setSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector],
    );
  };
  const { data: clients = [], isLoading: isLoadingClients } = useClientSearch(clientSearch);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: { type: 'HOUSE' },
  });

  const selectedUserId = watch('userId');

  const onSubmit = (data: PropertyFormValues) => {
    createProperty.mutate(
      { ...data, activeSectors: sectors.length > 0 ? sectors : undefined },
      {
        onSuccess: (response) => {
          reset();
          setSelectedClientLabel('');
          setClientSearch('');
          setSectors([]);
          onOpenChange(false);
          const propertyId = response.data?.id;
          if (propertyId) {
            router.push(`/properties/${propertyId}`);
          }
        },
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Propiedad</DialogTitle>
            <DialogDescription>
              Completá los datos de la nueva propiedad. El plan de mantenimiento se generará después
              de completar la inspección visual.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <input type="hidden" {...register('userId')} />
              <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientPopoverOpen}
                    aria-describedby={errors.userId ? 'userId-error' : undefined}
                    className="w-full justify-between font-normal"
                  >
                    {selectedClientLabel || 'Seleccionar cliente...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por nombre o email..."
                      value={clientSearch}
                      onValueChange={setClientSearch}
                    />
                    <CommandList>
                      {isLoadingClients ? (
                        <div className="text-muted-foreground py-6 text-center text-sm">
                          Buscando...
                        </div>
                      ) : clients.length === 0 ? (
                        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.id}
                              onSelect={() => {
                                setValue('userId', client.id, { shouldValidate: true });
                                setSelectedClientLabel(`${client.name} (${client.email})`);
                                setClientPopoverOpen(false);
                                setClientSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedUserId === client.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{client.name}</span>
                                <span className="text-muted-foreground text-xs">
                                  {client.email}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <button
                type="button"
                className="text-primary text-xs hover:underline"
                onClick={() => setInviteDialogOpen(true)}
              >
                + Invitar nuevo cliente
              </button>
              {errors.userId && (
                <p id="userId-error" role="alert" className="text-destructive text-sm">
                  {errors.userId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-address">Dirección</Label>
              <Input
                id="prop-address"
                aria-describedby={errors.address ? 'address-error' : undefined}
                {...register('address')}
              />
              {errors.address && (
                <p id="address-error" role="alert" className="text-destructive text-sm">
                  {errors.address.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-city">Ciudad</Label>
              <Input
                id="prop-city"
                aria-describedby={errors.city ? 'city-error' : undefined}
                {...register('city')}
              />
              {errors.city && (
                <p id="city-error" role="alert" className="text-destructive text-sm">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-type">Tipo</Label>
              <Select
                defaultValue="HOUSE"
                onValueChange={(v) => setValue('type', v as PropertyFormValues['type'])}
              >
                <SelectTrigger id="prop-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-year">Año de construcción</Label>
                <Input
                  id="prop-year"
                  type="number"
                  aria-describedby={errors.yearBuilt ? 'yearBuilt-error' : undefined}
                  {...register('yearBuilt', {
                    setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                  })}
                />
                {errors.yearBuilt && (
                  <p id="yearBuilt-error" role="alert" className="text-destructive text-sm">
                    {errors.yearBuilt.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-sqm">Metros cuadrados</Label>
                <Input
                  id="prop-sqm"
                  type="number"
                  step="0.1"
                  aria-describedby={errors.squareMeters ? 'squareMeters-error' : undefined}
                  {...register('squareMeters', {
                    setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                  })}
                />
                {errors.squareMeters && (
                  <p id="squareMeters-error" role="alert" className="text-destructive text-sm">
                    {errors.squareMeters.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sectores de la vivienda</Label>
              <p className="text-muted-foreground text-xs">
                Seleccioná los sectores que tiene esta propiedad. Podés modificarlos después.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(PROPERTY_SECTOR_LABELS).map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sectors.includes(value as PropertySector)}
                      onChange={() => toggleSector(value as PropertySector)}
                      className="accent-primary h-4 w-4 rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProperty.isPending}>
                {createProperty.isPending ? 'Creando...' : 'Crear Propiedad'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <InviteClientDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />
    </>
  );
}
