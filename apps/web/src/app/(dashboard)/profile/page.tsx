'use client';

import {
  changePasswordSchema,
  getErrorMessage,
  updateProfileSchema,
  UserRole,
  WHATSAPP_CONTACT_NUMBER,
} from '@epde/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { changePassword, updateProfile } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth-store';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.CLIENT]: 'Cliente',
};

// ─── Profile form schema ───
const profileSchema = updateProfileSchema;
type ProfileFormData = z.infer<typeof profileSchema>;

// ─── Password form schema (with confirm) ───
const passwordSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  useEffect(() => {
    document.title = 'Mi Perfil | EPDE';
  }, []);

  const user = useAuthStore((s) => s.user);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  if (!user) {
    return (
      <div role="status" aria-label="Cargando perfil" className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <PageHeader title="Perfil" description="Gestioná tu información personal y contraseña." />

      {/* User info card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información de la cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">Nombre</dt>
              <dd className="text-sm font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Email</dt>
              <dd className="text-sm font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Teléfono</dt>
              <dd className="text-sm font-medium">{user.phone || 'No registrado'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Rol</dt>
              <dd className="text-sm font-medium">{ROLE_LABELS[user.role] ?? user.role}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Fecha de creación</dt>
              <dd className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Subscription card — clients only */}
      {user.role === UserRole.CLIENT && user.subscriptionExpiresAt && (
        <SubscriptionInfo expiresAt={user.subscriptionExpiresAt} />
      )}

      {/* Edit profile */}
      <ProfileForm user={user} onSuccess={checkAuth} />

      {/* Change password */}
      <ChangePasswordForm />
    </PageTransition>
  );
}

function ProfileForm({
  user,
  onSuccess,
}: {
  user: { name: string; phone: string | null };
  onSuccess: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? '',
    },
  });

  async function onSubmit(data: ProfileFormData) {
    setIsLoading(true);
    try {
      await updateProfile(data);
      await onSuccess();
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al actualizar perfil'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Editar perfil</CardTitle>
        <CardDescription>Modificá tu nombre y teléfono de contacto.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Tu nombre completo"
              aria-describedby={errors.name ? 'profile-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="profile-name-error" role="alert" className="text-destructive text-sm">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-muted-foreground">
              Teléfono
            </Label>
            <Input
              id="phone"
              placeholder="+54 11 1234-5678"
              aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
              {...register('phone')}
            />
            {errors.phone && (
              <p id="profile-phone-error" role="alert" className="text-destructive text-sm">
                {errors.phone.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading || !isDirty}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordForm() {
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

// ─── Subscription Info (Client only) ──────────────────────

function SubscriptionInfo({ expiresAt }: { expiresAt: string }) {
  const { exp, isExpired, isNearExpiry, variant, label } = useMemo(() => {
    const d = new Date(expiresAt);
    const days = Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60_000));
    const expired = days < 0;
    const near = !expired && days <= 7;
    return {
      exp: d,
      daysLeft: days,
      isExpired: expired,
      isNearExpiry: near,
      variant: expired
        ? ('destructive' as const)
        : near
          ? ('warning' as const)
          : ('success' as const),
      label: expired ? 'Expirada' : `${days} día${days === 1 ? '' : 's'} restantes`,
    };
  }, [expiresAt]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Tu suscripción
          </CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-sm">Vencimiento</dt>
            <dd className="text-sm font-medium">
              {exp.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Estado</dt>
            <dd className="text-sm font-medium">{isExpired ? 'Sin acceso' : 'Acceso completo'}</dd>
          </div>
        </dl>
        {(isExpired || isNearExpiry) && (
          <div className="mt-4">
            <a
              href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=Hola, quiero renovar mi suscripción a EPDE`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Contactar para renovar →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
