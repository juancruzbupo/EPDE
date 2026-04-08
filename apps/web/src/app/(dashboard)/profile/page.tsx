'use client';

import { UserRole } from '@epde/shared';
import { HelpCircle } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { resetOnboardingTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';

import { ChangePasswordForm } from './change-password-form';
import { ProfileForm } from './profile-form';
import { SubscriptionInfo } from './subscription-info';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.CLIENT]: 'Cliente',
};

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

      {user.role === UserRole.CLIENT && user.subscriptionExpiresAt && (
        <SubscriptionInfo expiresAt={user.subscriptionExpiresAt} />
      )}

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="type-body-sm font-medium">Tour de la plataforma</p>
              <p className="type-body-sm text-muted-foreground">
                Volvé a ver la guía paso a paso del sistema
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetOnboardingTour();
              toast.success('El tour se mostrará cuando vuelvas al dashboard');
            }}
          >
            Ver tour de nuevo
          </Button>
        </CardContent>
      </Card>

      <ProfileForm user={user} onSuccess={checkAuth} />
      <ChangePasswordForm />
    </PageTransition>
  );
}
