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
    target: '[data-tour="sidebar-nav"]',
    title: 'Navegación',
    content:
      'Desde acá accedés a tus tareas, propiedades, presupuestos y servicios. Te avisamos por email y notificaciones cuando haya algo pendiente.',
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
    title: 'Filtros por estado',
    content:
      'Tocá cualquier tarjeta para filtrar las tareas por estado. "Vencidas" son las que pasaron su fecha. "Próximas" son las que vencen en los próximos 30 días.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="task-filters"]',
    title: 'Búsqueda y filtros',
    content:
      'Podés buscar por nombre, filtrar por prioridad o por propiedad para encontrar tareas específicas.',
  },
  {
    target: '[data-tour="task-list"]',
    title: 'Lista de tareas',
    content:
      'Hacé click en una tarea para ver el detalle y completarla. Solo necesitás indicar el estado en que encontraste todo y quién lo hizo.',
  },
];

export function TasksTour() {
  return useTour('epde-tour-tasks', TASKS_STEPS);
}

// ─── Property detail tour ───────────────────────────────

const PROPERTY_STEPS = [
  {
    target: '[data-tour="property-tabs"]',
    title: 'Secciones de tu propiedad',
    content:
      'Tu propiedad tiene varias secciones: salud general, plan de mantenimiento, gastos y fotos. Explorá cada una para tener el panorama completo.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="property-health"]',
    title: 'Salud de la vivienda',
    content:
      'Acá ves el puntaje ISV desglosado por dimensión: cumplimiento, estado, cobertura e inversión. Te muestra qué sectores necesitan más atención.',
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
    title: 'Estado del presupuesto',
    content:
      'Acá ves en qué etapa está tu presupuesto. Cuando EPDE te manda la cotización, podés aprobarla o rechazarla desde acá.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="budget-actions"]',
    title: 'Tus acciones',
    content:
      'Si el presupuesto fue cotizado, podés aprobarlo para que avancemos con el trabajo o rechazarlo. También podés dejar comentarios si tenés dudas.',
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
      'Este es el plan que armó la arquitecta después de inspeccionar tu vivienda. Tiene todas las tareas programadas organizadas por categoría.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="plan-status-summary"]',
    title: 'Estado de las tareas',
    content:
      'Acá ves cuántas tareas están vencidas, pendientes o próximas. Hacé click en una tarea para ver el detalle y completarla.',
  },
];

export function PlanViewerTour() {
  return useTour('epde-tour-plan-viewer', PLAN_VIEWER_STEPS);
}

// ─── Expenses tab tour ──────────────────────────────────

const EXPENSES_STEPS = [
  {
    target: '[data-tour="expenses-stats"]',
    title: 'Resumen de gastos',
    content:
      'Acá ves cuánto llevas gastado en mantenimiento: el total acumulado, el promedio mensual y la categoría donde más invertiste.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="expenses-breakdown"]',
    title: 'Desglose por sector',
    content:
      'Podés ver cómo se distribuyen los gastos por sector de la vivienda o por categoría. Los costos de tareas y presupuestos se separan para que veas cuánto va a prevención vs. reparación.',
  },
];

export function ExpensesTour() {
  return useTour('epde-tour-expenses', EXPENSES_STEPS);
}

// ─── Properties list tour ───────────────────────────────

const PROPERTIES_LIST_STEPS = [
  {
    target: '[data-tour="properties-filters"]',
    title: 'Buscá y filtrá',
    content:
      'Buscá por dirección o ciudad. Filtrá por tipo de vivienda o por el estado del plan de mantenimiento.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="properties-table"]',
    title: 'Tus propiedades',
    content:
      'Cada fila es una propiedad con su plan de mantenimiento. Hacé click en una para ver el detalle completo: salud, tareas, gastos y fotos.',
  },
];

export function PropertiesListTour() {
  return useTour('epde-tour-properties', PROPERTIES_LIST_STEPS);
}

// ─── Budgets list tour ──────────────────────────────────

const BUDGETS_LIST_STEPS = [
  {
    target: '[data-tour="budgets-action"]',
    title: 'Solicitar presupuesto',
    content:
      'Si necesitás reparar o mejorar algo en tu vivienda, pedí un presupuesto desde acá. EPDE te prepara una cotización con el detalle de costos.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="budgets-table"]',
    title: 'Tus presupuestos',
    content:
      'Acá ves todos tus presupuestos: pendientes de cotización, cotizados esperando tu aprobación, aprobados y completados.',
  },
];

export function BudgetsListTour() {
  return useTour('epde-tour-budgets-list', BUDGETS_LIST_STEPS);
}

// ─── Service requests list tour ─────────────────────────

const SERVICES_LIST_STEPS = [
  {
    target: '[data-tour="services-action"]',
    title: 'Nueva solicitud',
    content:
      'Si detectás un problema o necesitás asistencia profesional, creá una solicitud de servicio. EPDE la revisa y coordina la intervención.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="services-filters"]',
    title: 'Filtrá por estado o urgencia',
    content:
      'Podés filtrar por estado (abierta, en revisión, en progreso, resuelta) y por nivel de urgencia para encontrar solicitudes específicas.',
  },
];

export function ServicesListTour() {
  return useTour('epde-tour-services-list', SERVICES_LIST_STEPS);
}

// ─── Maintenance plans list tour ────────────────────────

const PLANS_LIST_STEPS = [
  {
    target: '[data-tour="plans-list"]',
    title: 'Tus planes de mantenimiento',
    content:
      'Cada propiedad tiene un plan con todas las tareas programadas. Los planes activos generan recordatorios y afectan tu puntaje ISV. Hacé click en uno para ver el detalle.',
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
