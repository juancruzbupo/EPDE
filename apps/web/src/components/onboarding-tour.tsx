'use client';

import { useCallback, useEffect, useState } from 'react';

// ─── Shared styles & locale ─────────────────────────────

const LOCALE = {
  back: 'Anterior',
  close: 'Cerrar',
  last: 'Entendido',
  next: 'Siguiente',
  skip: 'Saltar tour',
};

const JOYRIDE_STYLES = {
  options: { primaryColor: '#a65636', zIndex: 10000, overlayColor: 'rgba(0, 0, 0, 0.6)' },
  overlay: { mixBlendMode: 'normal' as const },
  tooltip: {
    borderRadius: 16,
    fontSize: 15,
    padding: 24,
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  tooltipTitle: { fontSize: 18, fontWeight: 700 as const, marginBottom: 8 },
  tooltipContent: { fontSize: 15, lineHeight: 1.6, color: '#444' },
  buttonNext: { borderRadius: 8, fontSize: 14, padding: '10px 20px', fontWeight: 600 as const },
  buttonBack: { color: '#666', fontSize: 14 },
  buttonSkip: { color: '#999', fontSize: 13 },
};

// ─── Generic tour hook ──────────────────────────────────

function useTour(storageKey: string, steps: Record<string, unknown>[]) {
  const [run, setRun] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Joyride, setJoyride] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (localStorage.getItem(storageKey)) return;
    import('react-joyride').then((mod) => {
      setJoyride(() => mod.Joyride);
      setTimeout(() => setRun(true), 800);
    });
  }, [storageKey]);

  const handleCallback = useCallback(
    (data: { status: string }) => {
      if (data.status === 'finished' || data.status === 'skipped') {
        localStorage.setItem(storageKey, 'true');
        setRun(false);
      }
    },
    [storageKey],
  );

  const element =
    Joyride && run ? (
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        showProgress
        scrollOffset={100}
        spotlightPadding={8}
        callback={handleCallback}
        locale={LOCALE}
        styles={JOYRIDE_STYLES}
        floaterProps={{ hideArrow: false }}
      />
    ) : null;

  return element;
}

// ─── Dashboard tour ─────────────────────────────────────

const DASHBOARD_STEPS = [
  {
    target: '[data-tour="health-score"]',
    title: 'ISV: el estado de tu casa',
    content:
      'Este número va de 0 a 100. Sube cuando completás tareas a tiempo y baja cuando se vencen. Cuanto más alto, mejor está tu vivienda.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="mini-stats"]',
    title: 'Tus tareas de un vistazo',
    content:
      'Vencidas: pasaron la fecha. Pendientes: tienen fecha pero falta más de 30 días. Completadas: lo que hiciste este mes.',
  },
  {
    target: '[data-tour="action-buttons"]',
    title: '¿Qué hago primero?',
    content:
      '"Ver qué hacer" te muestra las tareas más urgentes. "Ver análisis completo" te muestra cómo viene tu vivienda en el tiempo.',
  },
  {
    target: '[data-tour="sidebar-nav"]',
    title: 'Menú principal',
    content:
      'Desde acá accedés a todo: tareas, propiedades, presupuestos y servicios. También te llegan avisos por email cuando haya algo pendiente.',
    placement: 'right' as const,
  },
];

export function DashboardTour() {
  return useTour('epde-tour-dashboard', DASHBOARD_STEPS);
}

// ─── Tasks page tour ────────────────────────────────────

const TASKS_STEPS = [
  {
    target: '[data-tour="task-stats"]',
    title: 'Filtrá por estado',
    content:
      'Hacé click en una tarjeta para ver solo las tareas de ese estado. Vencidas = pasaron la fecha. Próximas = vencen en menos de 30 días.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="task-filters"]',
    title: 'Buscá tareas',
    content: 'Buscá por nombre o filtrá por prioridad y propiedad.',
  },
  {
    target: '[data-tour="task-list"]',
    title: 'Completar una tarea',
    content:
      'Hacé click en cualquier tarea para ver el detalle. Para completarla solo tenés que indicar en qué estado la encontraste y quién la hizo.',
  },
];

export function TasksTour() {
  return useTour('epde-tour-tasks', TASKS_STEPS);
}

// ─── Property detail tour ───────────────────────────────

const PROPERTY_STEPS = [
  {
    target: '[data-tour="property-tabs"]',
    title: 'Todo sobre tu vivienda',
    content:
      'Salud te muestra el puntaje ISV. Plan tiene las tareas programadas. Gastos muestra cuánto llevas invertido. Fotos guarda el registro visual.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="property-health"]',
    title: 'Índice de Salud (ISV)',
    content:
      'El ISV responde 5 preguntas: ¿estás al día con las tareas? ¿en qué estado está todo? ¿se revisaron todos los sectores? ¿prevenís o reparás? ¿mejora o empeora?',
    placement: 'bottom' as const,
  },
];

export function PropertyTour() {
  return useTour('epde-tour-property', PROPERTY_STEPS);
}

// ─── Budget detail tour ─────────────────────────────────

const BUDGET_STEPS = [
  {
    target: '[data-tour="budget-status"]',
    title: 'Ciclo del presupuesto',
    content:
      'Primero lo solicitás, EPDE lo cotiza con detalle de costos, y vos decidís si aprobarlo o rechazarlo.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="budget-actions"]',
    title: 'Aprobar o rechazar',
    content:
      'Cuando la cotización esté lista, aparecen los botones para aprobar o rechazar. Si tenés dudas, podés dejar un comentario antes de decidir.',
  },
];

export function BudgetTour() {
  return useTour('epde-tour-budget', BUDGET_STEPS);
}

// ─── Plan viewer tour ───────────────────────────────────

const PLAN_VIEWER_STEPS = [
  {
    target: '[data-tour="plan-title"]',
    title: 'Tu plan de mantenimiento',
    content:
      'La arquitecta armó este plan después de inspeccionar tu vivienda. Tiene todas las tareas que tu casa necesita, organizadas por categoría.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="plan-status-summary"]',
    title: 'Resumen del plan',
    content:
      'De un vistazo ves cuántas tareas están vencidas, pendientes o próximas. Hacé click en cualquiera para ver el detalle.',
  },
];

export function PlanViewerTour() {
  return useTour('epde-tour-plan-viewer', PLAN_VIEWER_STEPS);
}

// ─── Expenses tab tour ──────────────────────────────────

const EXPENSES_STEPS = [
  {
    target: '[data-tour="expenses-stats"]',
    title: 'Lo que llevas invertido',
    content:
      'Total acumulado en mantenimiento, cuánto gastás por mes en promedio, y en qué categoría se concentra la inversión.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="expenses-breakdown"]',
    title: 'Dónde se va la plata',
    content:
      'Ves cuánto se gasta en cada sector de tu casa. Podés alternar entre vista por sector y por categoría.',
  },
];

export function ExpensesTour() {
  return useTour('epde-tour-expenses', EXPENSES_STEPS);
}

// ─── Properties list tour ───────────────────────────────

const PROPERTIES_LIST_STEPS = [
  {
    target: '[data-tour="properties-filters"]',
    title: 'Buscá tu propiedad',
    content: 'Buscá por dirección o ciudad. Filtrá por tipo de vivienda o por estado del plan.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="properties-table"]',
    title: 'Tus propiedades',
    content:
      'Hacé click en una propiedad para ver su salud, plan de mantenimiento, gastos y fotos.',
  },
];

export function PropertiesListTour() {
  return useTour('epde-tour-properties', PROPERTIES_LIST_STEPS);
}

// ─── Budgets list tour ──────────────────────────────────

const BUDGETS_LIST_STEPS = [
  {
    target: '[data-tour="budgets-action"]',
    title: 'Pedí un presupuesto',
    content:
      '¿Necesitás reparar o mejorar algo? Pedilo desde acá. EPDE te prepara una cotización con el detalle.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="budgets-table"]',
    title: 'Tus presupuestos',
    content:
      'Acá ves todos: los que esperan cotización, los cotizados que necesitan tu aprobación, y los ya completados.',
  },
];

export function BudgetsListTour() {
  return useTour('epde-tour-budgets-list', BUDGETS_LIST_STEPS);
}

// ─── Service requests list tour ─────────────────────────

const SERVICES_LIST_STEPS = [
  {
    target: '[data-tour="services-action"]',
    title: '¿Detectaste un problema?',
    content:
      'Creá una solicitud de servicio y EPDE coordina la intervención profesional. También podés crearla desde una tarea.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="services-filters"]',
    title: 'Seguí tus solicitudes',
    content:
      'Filtrá por estado (abierta, en revisión, resuelta) o por urgencia para encontrar una solicitud rápido.',
  },
];

export function ServicesListTour() {
  return useTour('epde-tour-services-list', SERVICES_LIST_STEPS);
}

// ─── Maintenance plans list tour ────────────────────────

const PLANS_LIST_STEPS = [
  {
    target: '[data-tour="plans-list"]',
    title: 'Planes de mantenimiento',
    content:
      'Cada propiedad tiene un plan con sus tareas programadas. Los activos generan recordatorios automáticos. Hacé click en uno para ver las tareas.',
    disableBeacon: true,
  },
];

export function PlansListTour() {
  return useTour('epde-tour-plans-list', PLANS_LIST_STEPS);
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
];

export function resetOnboardingTour() {
  TOUR_KEYS.forEach((key) => localStorage.removeItem(key));
}
