'use client';

import { setPasswordSchema } from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setPassword } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

/** Extends shared password rules with client-side confirmPassword refinement. */
const schema = setPasswordSchema
  .pick({ newPassword: true })
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const hasToken = !!token;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  // Watch password para evaluar reglas en vivo. Sirve a Carlos (52, lee
  // todo y quiere saber qué le falta) y a Norma (68, insegura de si ya
  // puede enviar). Disabled el submit hasta que las 4 reglas pasen.
  const password = watch('newPassword') ?? '';
  const rules = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Al menos una minúscula', ok: /[a-z]/.test(password) },
    { label: 'Al menos un número', ok: /\d/.test(password) },
  ];
  const allRulesOk = rules.every((r) => r.ok);

  async function onSubmit(data: FormData) {
    setError(null);
    setIsLoading(true);
    try {
      await setPassword(token, data.newPassword);
      toast.success('Contraseña configurada. Ya podés ingresar.');
      router.push(ROUTES.login);
    } catch {
      setError('Token inválido o expirado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">Configurar Contraseña</CardTitle>
        <CardDescription>Creá tu contraseña para acceder a EPDE</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasToken ? (
          <p role="alert" className="text-destructive type-label-sm text-center">
            Token no proporcionado. Verificá el enlace de invitación.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                  autoComplete="new-password"
                  aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p id="newPassword-error" role="alert" className="text-destructive type-label-sm">
                  {errors.newPassword.message}
                </p>
              )}
              <ul className="type-body-sm space-y-1" aria-label="Requisitos de la contraseña">
                {rules.map((rule) => (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-2 ${
                      rule.ok ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    {rule.ok ? (
                      <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <X className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
                    )}
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  role="alert"
                  className="text-destructive type-label-sm"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-destructive type-label-sm text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !hasToken || !allRulesOk}
            >
              {isLoading ? 'Configurando...' : 'Configurar Contraseña'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-center">Cargando...</div>}>
      <SetPasswordForm />
    </Suspense>
  );
}
