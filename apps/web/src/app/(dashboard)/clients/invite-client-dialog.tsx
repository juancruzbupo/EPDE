'use client';

import { type CreateClientInput, createClientSchema } from '@epde/shared';
import { getErrorMessage } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateClient } from '@/hooks/use-clients';

interface InviteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteClientDialog({ open, onOpenChange }: InviteClientDialogProps) {
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
  });

  const onSubmit = (data: CreateClientInput) => {
    createClient.mutate(data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  const errorMessage = createClient.error ? getErrorMessage(createClient.error, '') : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invitar Cliente</DialogTitle>
          <DialogDescription>Enviá una invitación por email al nuevo cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@email.com"
              required
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-destructive text-xs">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Nombre completo"
              required
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="text-destructive text-xs">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-muted-foreground">
              Teléfono
            </Label>
            <Input id="phone" placeholder="+54 11 1234-5678" {...register('phone')} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? 'Enviando...' : 'Enviar invitación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
