'use client';

import { changePasswordSchema, getErrorMessage } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/lib/auth';

const passwordSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmit(data: PasswordFormData) {
    setIsLoading(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Contraseña actualizada');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al cambiar contraseña'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>Ingresá tu contraseña actual y la nueva contraseña.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              Contraseña actual <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                placeholder="********"
                className="pr-10"
                required
                autoComplete="current-password"
                aria-describedby={errors.currentPassword ? 'currentPassword-error' : undefined}
                {...register('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                tabIndex={-1}
                aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p id="currentPassword-error" role="alert" className="text-destructive text-sm">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">
              Nueva contraseña <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                placeholder="********"
                className="pr-10"
                required
                autoComplete="new-password"
                aria-describedby={errors.newPassword ? 'pwd-newPassword-error' : undefined}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                tabIndex={-1}
                aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p id="pwd-newPassword-error" role="alert" className="text-destructive text-sm">
                {errors.newPassword.message}
              </p>
            )}
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una mayúscula</li>
              <li>Al menos una minúscula</li>
              <li>Al menos un número</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirmar nueva contraseña <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="********"
                className="pr-10"
                required
                autoComplete="new-password"
                aria-describedby={errors.confirmPassword ? 'pwd-confirmPassword-error' : undefined}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                tabIndex={-1}
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="pwd-confirmPassword-error" role="alert" className="text-destructive text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cambiar contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
