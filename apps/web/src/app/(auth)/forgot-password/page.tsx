'use client';

import { type ForgotPasswordInput, forgotPasswordSchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSubmitted(true);
    } catch {
      setError('Ocurrió un error. Intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">Recuperar Contraseña</CardTitle>
        <CardDescription>
          Ingresá tu email y te enviaremos instrucciones para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground type-body-sm">
              Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.
            </p>
            <Link href={ROUTES.login} className="text-primary type-body-sm hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-destructive type-label-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-destructive text-center text-sm">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>

            <p className="text-center">
              <Link href={ROUTES.login} className="text-primary type-body-sm hover:underline">
                Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
