'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPropertySchema, PROPERTY_TYPE_LABELS } from '@epde/shared';
import { z } from 'zod';
import { Check, ChevronsUpDown } from 'lucide-react';

type PropertyFormValues = z.input<typeof createPropertySchema>;
import { useCreateProperty } from '@/hooks/use-properties';
import { useClientSearch } from '@/hooks/use-clients';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface CreatePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePropertyDialog({ open, onOpenChange }: CreatePropertyDialogProps) {
  const createProperty = useCreateProperty();
  const [clientSearch, setClientSearch] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [selectedClientLabel, setSelectedClientLabel] = useState('');
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
    createProperty.mutate(data, {
      onSuccess: () => {
        reset();
        setSelectedClientLabel('');
        setClientSearch('');
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Propiedad</DialogTitle>
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
                              <span className="text-muted-foreground text-xs">{client.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.userId && <p className="text-destructive text-sm">{errors.userId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="prop-address">Dirección</Label>
            <Input id="prop-address" {...register('address')} />
            {errors.address && <p className="text-destructive text-sm">{errors.address.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="prop-city">Ciudad</Label>
            <Input id="prop-city" {...register('city')} />
            {errors.city && <p className="text-destructive text-sm">{errors.city.message}</p>}
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
                {...register('yearBuilt', {
                  setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                })}
              />
              {errors.yearBuilt && (
                <p className="text-destructive text-sm">{errors.yearBuilt.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-sqm">Metros cuadrados</Label>
              <Input
                id="prop-sqm"
                type="number"
                step="0.1"
                {...register('squareMeters', {
                  setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                })}
              />
              {errors.squareMeters && (
                <p className="text-destructive text-sm">{errors.squareMeters.message}</p>
              )}
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
  );
}
