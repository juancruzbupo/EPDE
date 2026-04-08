'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventData, Props, Step } from 'react-joyride';

// ─── Shared config ──────────────────────────────────────

const LOCALE = {
  back: 'Anterior',
  close: 'Cerrar',
  last: 'Listo',
  next: 'Siguiente',
  skip: 'Cerrar',
  open: 'Abrir guía',
};

const SHARED_STEP_DEFAULTS: Partial<Step> = {
  showProgress: true,
  scrollOffset: 100,
  spotlightPadding: 8,
  primaryColor: '#a65636',
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
  tooltipContent: { fontSize: 15, lineHeight: 1.6, color: '#444' },
  buttonPrimary: { borderRadius: 8, fontSize: 14, padding: '10px 20px', fontWeight: 600 },
  buttonBack: { color: '#666', fontSize: 14 },
  buttonSkip: { color: '#999', fontSize: 13 },
  overlay: { mixBlendMode: 'normal' as const },
};

// ─── Reusable Tour component ────────────────────────────

function Tour({ storageKey, steps }: { storageKey: string; steps: Step[] }) {
  const [run, setRun] = useState(false);
  const [JoyrideComponent, setJoyrideComponent] = useState<React.ComponentType<Props> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
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
  }, [storageKey]);

  const handleEvent = useCallback(
    (data: EventData) => {
      if (data.status === 'finished' || data.status === 'skipped') {
        localStorage.setItem(storageKey, 'true');
        setRun(false);
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

// ─── Dashboard tour ─────────────────────────────────────

const DASHBOARD_STEPS: Step[] = [
  {
    target: '[data-tour="health-score"]',
    title: 'ISV: el estado de tu casa',
    content:
      'Va de 0 a 100. Sube cuando completás tareas a tiempo, baja cuando se vencen. Si ves un fuego 🔥 es tu racha de meses al día. Un ISV bajo = reparaciones más caras.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="mini-stats"]',
    title: 'Tus tareas de un vistazo',
    content:
      'Vencidas: pasaron la fecha, atendelas primero. Pendientes: programadas a más de 30 días. Completadas: lo que hiciste este mes. Presupuestos: cotizaciones esperando tu decisión.',
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="action-buttons"]',
    title: '¿Qué hago primero?',
    content:
      '"Ver qué hacer" te muestra las tareas más urgentes. "Ver análisis completo" te muestra cómo evoluciona tu vivienda en el tiempo.',
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="sidebar-nav"]',
    title: 'Menú principal',
    content:
      'Desde acá accedés a todo: tareas, propiedades, presupuestos y servicios. También te llegan avisos por email y notificaciones en el celular.',
    placement: 'right',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function DashboardTour() {
  return <Tour storageKey="epde-tour-dashboard" steps={DASHBOARD_STEPS} />;
}

// ─── Tasks page tour ────────────────────────────────────

const TASKS_STEPS: Step[] = [
  {
    target: '[data-tour="task-stats"]',
    title: 'Filtrá por estado',
    content:
      'Hacé click en una tarjeta para ver solo las tareas de ese estado. Vencidas = pasaron la fecha, son las más urgentes. Próximas = vencen en los próximos 30 días.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="task-filters"]',
    title: 'Buscá y filtrá',
    content:
      'Buscá por nombre o filtrá por prioridad: Alta = requiere atención pronto, Media = mantenimiento regular, Baja = mejoras opcionales.',
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="task-list"]',
    title: 'Completar una tarea',
    content:
      'Hacé click en una tarea para ver el detalle. Para completarla solo indicás el estado en que encontraste todo y quién lo hizo. Tarda menos de 1 minuto.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function TasksTour() {
  return <Tour storageKey="epde-tour-tasks" steps={TASKS_STEPS} />;
}

// ─── Property detail tour ───────────────────────────────

const PROPERTY_STEPS: Step[] = [
  {
    target: '[data-tour="property-tabs"]',
    title: 'Todo sobre tu vivienda',
    content:
      'Salud te muestra el puntaje ISV. Plan tiene las tareas programadas. Gastos muestra cuánto llevas invertido. Fotos guarda el registro visual.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="property-health"]',
    title: 'Índice de Salud (ISV)',
    content:
      'El ISV responde 5 preguntas: ¿estás al día con las tareas? ¿en qué estado está todo? ¿se revisaron todos los sectores? ¿prevenís o reparás? ¿mejora o empeora?',
    placement: 'bottom',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function PropertyTour() {
  return <Tour storageKey="epde-tour-property" steps={PROPERTY_STEPS} />;
}

// ─── Budget detail tour ─────────────────────────────────

const BUDGET_STEPS: Step[] = [
  {
    target: '[data-tour="budget-status"]',
    title: 'Tu presupuesto',
    content:
      'El badge de arriba muestra en qué etapa está: Pendiente = esperando cotización. Cotizado = EPDE te envió el detalle, revisalo y decidí si aprobarlo. Aprobado = el trabajo ya está en marcha.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
];

export function BudgetTour() {
  return <Tour storageKey="epde-tour-budget" steps={BUDGET_STEPS} />;
}

// ─── Plan viewer tour ───────────────────────────────────

const PLAN_VIEWER_STEPS: Step[] = [
  {
    target: '[data-tour="plan-title"]',
    title: 'Tu plan de mantenimiento',
    content:
      'La arquitecta armó este plan después de inspeccionar tu vivienda. Tiene todas las tareas que tu casa necesita, organizadas por categoría.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="plan-status-summary"]',
    title: 'Resumen del plan',
    content:
      'De un vistazo ves cuántas tareas están vencidas, pendientes o próximas. Hacé click en cualquiera para ver el detalle.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function PlanViewerTour() {
  return <Tour storageKey="epde-tour-plan-viewer" steps={PLAN_VIEWER_STEPS} />;
}

// ─── Expenses tab tour ──────────────────────────────────

const EXPENSES_STEPS: Step[] = [
  {
    target: '[data-tour="expenses-stats"]',
    title: 'Lo que llevas invertido',
    content:
      'Total acumulado en mantenimiento, promedio mensual basado en tu historial, y la categoría donde más invertiste.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="expenses-breakdown"]',
    title: 'Dónde se va la plata',
    content:
      'Por sector = dónde en tu casa (techo, baño, exterior). Por categoría = qué tipo de trabajo (plomería, electricidad, pintura). Podés alternar con los botones.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function ExpensesTour() {
  return <Tour storageKey="epde-tour-expenses" steps={EXPENSES_STEPS} />;
}

// ─── Properties list tour ───────────────────────────────

const PROPERTIES_LIST_STEPS: Step[] = [
  {
    target: '[data-tour="properties-filters"]',
    title: 'Buscá tu propiedad',
    content: 'Buscá por dirección o ciudad. Filtrá por tipo de vivienda o por estado del plan.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="properties-table"]',
    title: 'Tus propiedades',
    content:
      'Hacé click en una propiedad para ver su salud, plan de mantenimiento, gastos y fotos.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function PropertiesListTour() {
  return <Tour storageKey="epde-tour-properties" steps={PROPERTIES_LIST_STEPS} />;
}

// ─── Budgets list tour ──────────────────────────────────

const BUDGETS_LIST_STEPS: Step[] = [
  {
    target: '[data-tour="budgets-action"]',
    title: 'Pedí un presupuesto',
    content:
      '¿Necesitás reparar o mejorar algo? Pedilo desde acá. EPDE te prepara una cotización con el detalle.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="budgets-table"]',
    title: 'Tus presupuestos',
    content:
      'Acá ves todos: los que esperan cotización, los cotizados que necesitan tu aprobación, y los ya completados.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function BudgetsListTour() {
  return <Tour storageKey="epde-tour-budgets-list" steps={BUDGETS_LIST_STEPS} />;
}

// ─── Service requests list tour ─────────────────────────

const SERVICES_LIST_STEPS: Step[] = [
  {
    target: '[data-tour="services-action"]',
    title: '¿Detectaste un problema?',
    content:
      'Creá una solicitud y EPDE coordina todo: la revisamos, la cotizamos si hace falta, y te avisamos cuando esté resuelta.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="services-filters"]',
    title: 'Seguí tus solicitudes',
    content:
      'Cada solicitud pasa por etapas: Abierta → En revisión → En progreso → Resuelta. Filtrá por estado o urgencia.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function ServicesListTour() {
  return <Tour storageKey="epde-tour-services-list" steps={SERVICES_LIST_STEPS} />;
}

// ─── Service request detail tour ────────────────────────

const SERVICE_DETAIL_STEPS: Step[] = [
  {
    target: '[data-tour="service-info"]',
    title: 'Tu solicitud de servicio',
    content:
      'Acá ves el estado actual, la urgencia y los datos de tu solicitud. EPDE la revisa, y te avisa por email y notificación cuando avance.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="service-comments"]',
    title: 'Comentarios',
    content:
      'Podés dejar mensajes para el equipo de EPDE. Si tenés dudas o querés agregar información, escribí acá.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function ServiceDetailTour() {
  return <Tour storageKey="epde-tour-service-detail" steps={SERVICE_DETAIL_STEPS} />;
}

// ─── Maintenance plans list tour ────────────────────────

const PLANS_LIST_STEPS: Step[] = [
  {
    target: '[data-tour="plans-list"]',
    title: 'Planes de mantenimiento',
    content:
      'Cada propiedad tiene un plan con sus tareas. Activo = en uso, genera recordatorios. Borrador = en preparación. Archivado = ya no se usa. Hacé click en uno para ver las tareas.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
];

export function PlansListTour() {
  return <Tour storageKey="epde-tour-plans-list" steps={PLANS_LIST_STEPS} />;
}

// ─── Reset all tours ────────────────────────────────────

const TOUR_KEYS = [
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
];

export function resetOnboardingTour() {
  TOUR_KEYS.forEach((key) => localStorage.removeItem(key));
}
