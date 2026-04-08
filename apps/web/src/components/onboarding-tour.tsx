'use client';

import { useCallback, useEffect, useState } from 'react';

const TOUR_STORAGE_KEY = 'epde-tour-completed';

const STEPS = [
  {
    target: '[data-tour="health-score"]',
    title: 'Puntaje de salud',
    content:
      'Este número mide el estado general de tu vivienda de 0 a 100. Sube cuando completás tareas a tiempo y baja cuando se vencen. Las tareas urgentes pesan más.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="mini-stats"]',
    title: 'Estado de tus tareas',
    content:
      'Acá ves cuántas tareas tenés vencidas, pendientes y completadas este mes. "Pendientes" son las que todavía no vencen. "Próximas" aparecen cuando faltan menos de 30 días.',
  },
  {
    target: '[data-tour="action-buttons"]',
    title: 'Acciones rápidas',
    content:
      '"Ver qué hacer" te lleva a las tareas pendientes. "Ver análisis completo" te muestra la evolución de tu vivienda en el tiempo.',
  },
  {
    target: 'nav[aria-label="Navegación principal"]',
    title: 'Navegación',
    content:
      'Desde el menú accedés a tus tareas, propiedades, presupuestos y solicitudes de servicio. Te avisamos por email y notificaciones cuando haya algo pendiente.',
  },
];

const LOCALE = {
  back: 'Anterior',
  close: 'Cerrar',
  last: 'Entendido',
  next: 'Siguiente',
  skip: 'Saltar tour',
};

const JOYRIDE_STYLES = {
  options: { primaryColor: '#a65636', zIndex: 10000 },
  tooltip: { borderRadius: 12, fontSize: 14, padding: 20 },
  tooltipTitle: { fontSize: 16, fontWeight: 700 as const },
  buttonNext: { borderRadius: 8, fontSize: 14, padding: '8px 16px' },
  buttonBack: { color: '#666', fontSize: 14 },
  buttonSkip: { color: '#999', fontSize: 13 },
};

export function OnboardingTour() {
  const [run, setRun] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [JoyrideComponent, setJoyrideComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (completed) return;

    import('react-joyride').then((mod) => {
      setJoyrideComponent(() => mod.Joyride);
      setTimeout(() => setRun(true), 1000);
    });
  }, []);

  const handleCallback = useCallback((data: { status: string }) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setRun(false);
    }
  }, []);

  if (!JoyrideComponent || !run) return null;

  return (
    <JoyrideComponent
      steps={STEPS}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      locale={LOCALE}
      styles={JOYRIDE_STYLES}
    />
  );
}

export function resetOnboardingTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
