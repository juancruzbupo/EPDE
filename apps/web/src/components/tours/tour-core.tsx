'use client';

import { DESIGN_TOKENS_LIGHT, UserRole } from '@epde/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventData, Props, Step } from 'react-joyride';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/auth-store';

// ─── Shared config ──────────────────────────────────────

export const LOCALE = {
  back: 'Anterior',
  close: 'Cerrar',
  last: 'Listo',
  next: 'Siguiente',
  skip: 'Cerrar',
  open: 'Abrir guía',
};

export const SHARED_STEP_DEFAULTS: Partial<Step> = {
  showProgress: true,
  scrollOffset: 100,
  spotlightPadding: 8,
  primaryColor: DESIGN_TOKENS_LIGHT.primary,
  overlayColor: 'rgba(0, 0, 0, 0.6)',
  zIndex: 10000,
};

const STYLES: Props['styles'] = {
  tooltip: {
    borderRadius: 16,
    fontSize: 15,
    padding: 24,
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  tooltipTitle: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  tooltipContent: { fontSize: 15, lineHeight: 1.6, color: DESIGN_TOKENS_LIGHT.foreground },
  buttonPrimary: { borderRadius: 8, fontSize: 14, padding: '10px 20px', fontWeight: 600 },
  buttonBack: { color: DESIGN_TOKENS_LIGHT.mutedForeground, fontSize: 14 },
  buttonSkip: { color: DESIGN_TOKENS_LIGHT.mutedForeground, fontSize: 13 },
  overlay: { mixBlendMode: 'normal' as const },
};

// ─── Reusable Tour component ────────────────────────────

/**
 * Wraps `react-joyride` with role gating, localStorage-based dismiss memory,
 * and lazy loading of the joyride bundle. Used by all concrete tour components.
 */
export function Tour({
  storageKey,
  steps,
  forRole = UserRole.CLIENT,
}: {
  storageKey: string;
  steps: Step[];
  forRole?: string;
}) {
  const role = useAuthStore((s) => s.user?.role);
  const [run, setRun] = useState(false);
  const [JoyrideComponent, setJoyrideComponent] = useState<React.ComponentType<Props> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (role !== forRole) return;
    if (localStorage.getItem(storageKey)) return;

    import('react-joyride').then((mod) => {
      setJoyrideComponent(() => mod.Joyride as React.ComponentType<Props>);
      timeoutRef.current = setTimeout(() => {
        if (!document.querySelector('[role="dialog"]')) {
          setRun(true);
        }
      }, 800);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [storageKey, forRole, role]);

  const handleEvent = useCallback(
    (data: EventData) => {
      if (data.status === 'finished' || data.status === 'skipped') {
        localStorage.setItem(storageKey, 'true');
        setRun(false);
        toast.info('Podés repetir el tour desde Perfil → Guía de uso', { duration: 5000 });
      }
      // Pause (not dismiss) if a dialog opens mid-tour
      if (data.type === 'step:after' && document.querySelector('[role="dialog"]')) {
        setRun(false);
      }
    },
    [storageKey],
  );

  if (!JoyrideComponent || !run) return null;

  return (
    <JoyrideComponent
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      locale={LOCALE}
      styles={STYLES}
    />
  );
}

// ─── Tour keys registry ─────────────────────────────────

export const TOUR_KEYS = [
  'epde-tour-dashboard',
  'epde-tour-tasks',
  'epde-tour-property',
  'epde-tour-budget',
  'epde-tour-properties',
  'epde-tour-budgets-list',
  'epde-tour-services-list',
  'epde-tour-plans-list',
  'epde-tour-plan-viewer',
  'epde-tour-expenses',
  'epde-tour-service-detail',
  'epde-tour-admin-dashboard',
  'epde-tour-inspection',
  'epde-tour-templates',
  'epde-tour-clients',
];

export function resetOnboardingTour() {
  TOUR_KEYS.forEach((key) => localStorage.removeItem(key));
}
