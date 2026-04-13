'use client';

import { UserRole } from '@epde/shared';
import { HelpCircle, Monitor, Moon, Sun } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { resetOnboardingTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';

import { ChangePasswordForm } from './change-password-form';
import { MilestonesSection } from './milestones-section';
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

      <AppearanceCard />

      <ProfileForm user={user} onSuccess={checkAuth} />
      <MilestonesSection />
      <ChangePasswordForm />
    </PageTransition>
  );
}

const THEME_OPTIONS = [
  { key: 'light', label: 'Claro', icon: Sun },
  { key: 'dark', label: 'Oscuro', icon: Moon },
  { key: 'system', label: 'Sistema', icon: Monitor },
] as const;

function AppearanceCard() {
  const [theme, setTheme] = useState<string>('system');

  useEffect(() => {
    setTheme(localStorage.getItem('theme') ?? 'system');
  }, []);

  const handleChange = useCallback((value: string) => {
    setTheme(value);
    if (value === 'system') {
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      localStorage.setItem('theme', value);
      document.documentElement.classList.toggle('dark', value === 'dark');
    }
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleChange(opt.key)}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-all ${
                theme === opt.key
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <opt.icon className="h-5 w-5" />
              <span className="type-label-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
