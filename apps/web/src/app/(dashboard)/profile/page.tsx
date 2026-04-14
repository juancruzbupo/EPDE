'use client';

import type { NotificationType } from '@epde/shared';
import { NOTIFICATION_TYPE_LABELS, UserRole } from '@epde/shared';
import { Bell, HelpCircle, Monitor, Moon, Sparkles, Sun, Type } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { resetOnboardingTour } from '@/components/onboarding-tour';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import {
  FONT_SCALE_LABELS,
  type FontScale,
  type MotivationStyle,
  useUiPreferencesStore,
} from '@/stores/ui-preferences-store';

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
      <TextSizeCard />
      <MotivationCard />
      <NotificationsCard />

      <ProfileForm user={user} onSuccess={checkAuth} />
      <MilestonesCardGuarded />
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

const FONT_SCALE_OPTIONS: FontScale[] = ['sm', 'base', 'lg', 'xl'];

function TextSizeCard() {
  const fontScale = useUiPreferencesStore((s) => s.fontScale);
  const setFontScale = useUiPreferencesStore((s) => s.setFontScale);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-4 w-4" aria-hidden="true" />
          Tamaño de texto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground type-body-sm">
          Ajustá el tamaño de todo el texto de la app. Útil si preferís leer más cómodo.
        </p>
        <div
          role="radiogroup"
          aria-label="Tamaño de texto"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {FONT_SCALE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={fontScale === opt}
              onClick={() => setFontScale(opt)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                fontScale === opt
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <span
                aria-hidden="true"
                className="font-semibold"
                style={{
                  fontSize:
                    opt === 'sm'
                      ? '0.8rem'
                      : opt === 'base'
                        ? '1rem'
                        : opt === 'lg'
                          ? '1.15rem'
                          : '1.3rem',
                }}
              >
                Aa
              </span>
              <span className="type-label-sm">{FONT_SCALE_LABELS[opt]}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const MOTIVATION_OPTIONS: {
  value: MotivationStyle;
  label: string;
  description: string;
}[] = [
  {
    value: 'rewards',
    label: 'Con celebraciones',
    description: 'Confeti, mensajes motivacionales, rachas y logros visibles.',
  },
  {
    value: 'minimal',
    label: 'Modo profesional',
    description: 'Solo datos. Sin confeti, sin rachas, sin desafíos semanales.',
  },
];

function MotivationCard() {
  const motivationStyle = useUiPreferencesStore((s) => s.motivationStyle);
  const setMotivationStyle = useUiPreferencesStore((s) => s.setMotivationStyle);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Estilo de la app
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground type-body-sm">
          Elegí cómo querés que se sienta la experiencia al completar tareas.
        </p>
        <div
          role="radiogroup"
          aria-label="Estilo de motivación"
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {MOTIVATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={motivationStyle === opt.value}
              onClick={() => setMotivationStyle(opt.value)}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                motivationStyle === opt.value
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <span className="type-label-lg text-foreground">{opt.label}</span>
              <span className="type-body-sm leading-relaxed">{opt.description}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MilestonesCardGuarded() {
  const motivationStyle = useUiPreferencesStore((s) => s.motivationStyle);
  if (motivationStyle === 'minimal') return null;
  return <MilestonesSection />;
}

const NOTIFICATION_TYPES: NotificationType[] = [
  'TASK_REMINDER',
  'BUDGET_UPDATE',
  'SERVICE_UPDATE',
  'SYSTEM',
];

const NOTIFICATION_HINTS: Record<NotificationType, string> = {
  TASK_REMINDER: 'Avisos de tareas por vencer o vencidas.',
  BUDGET_UPDATE: 'Cuando un presupuesto se cotiza o cambia de estado.',
  SERVICE_UPDATE: 'Avances en tus solicitudes de servicio.',
  SYSTEM: 'Anuncios y novedades de la plataforma.',
};

function NotificationsCard() {
  const hidden = useUiPreferencesStore((s) => s.hiddenNotificationTypes);
  const toggle = useUiPreferencesStore((s) => s.toggleHiddenNotificationType);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" aria-hidden="true" />
          Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground type-body-sm">
          Elegí qué tipos de notificaciones querés ver en la bandeja. Esto solo oculta la lista acá
          en la app; la entrega por correo o push depende del tipo de aviso.
        </p>
        <ul className="space-y-2">
          {NOTIFICATION_TYPES.map((type) => {
            const isHidden = hidden.includes(type);
            const id = `notif-${type}`;
            return (
              <li key={type} className="border-border flex items-start gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <label htmlFor={id} className="type-label-lg cursor-pointer">
                    {NOTIFICATION_TYPE_LABELS[type]}
                  </label>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {NOTIFICATION_HINTS[type]}
                  </p>
                </div>
                <input
                  id={id}
                  type="checkbox"
                  checked={!isHidden}
                  onChange={() => toggle(type)}
                  aria-label={`Mostrar notificaciones de ${NOTIFICATION_TYPE_LABELS[type]}`}
                  className="accent-primary mt-1 h-4 w-4 shrink-0"
                />
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
