'use client';

import { UserRole } from '@epde/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventData, Props, Step } from 'react-joyride';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/auth-store';

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

function Tour({
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
  }, [storageKey]);

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
      'Este plan se generó a partir de la inspección visual de tu vivienda. Las tareas y prioridades se asignaron según lo que la arquitecta encontró en cada sector.',
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
  {
    target: '[data-tour="plan-tasks"]',
    title: 'Índice de riesgo',
    content:
      'Cada tarea tiene un número de riesgo. Cuanto más alto, más urgente es resolverla. Las tareas se ordenan automáticamente para que veas primero las más importantes. Los problemas estructurales (techo, exterior, cimientos) puntúan más alto porque si no se atienden, escalan rápido.',
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

// ─── Admin Dashboard tour ───────────────────────────────

const ADMIN_DASHBOARD_STEPS: Step[] = [
  {
    target: '[data-tour="admin-kpis"]',
    title: 'Resumen ejecutivo',
    content:
      'Clientes activos, propiedades, tareas vencidas, presupuestos pendientes y solicitudes abiertas. Estos KPIs te dan el estado general de la plataforma de un vistazo.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="admin-attention"]',
    title: 'Atención necesaria',
    content:
      'Acá aparecen los items que requieren tu acción: presupuestos sin cotizar, solicitudes nuevas, tareas vencidas críticas. Si esta sección está vacía, todo está al día.',
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="admin-tabs"]',
    title: 'Análisis detallado',
    content:
      'Tres vistas: Operativo (tareas completadas, condiciones, sectores problemáticos), Tendencias (evolución mensual), Financiero (presupuestos, costos, SLA). Podés cambiar el rango de meses.',
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="admin-activity"]',
    title: 'Actividad reciente',
    content:
      'Últimas acciones de los clientes: tareas completadas, presupuestos aprobados, solicitudes creadas. Te ayuda a ver qué está pasando sin entrar a cada cliente.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function AdminDashboardTour() {
  return (
    <Tour
      storageKey="epde-tour-admin-dashboard"
      steps={ADMIN_DASHBOARD_STEPS}
      forRole={UserRole.ADMIN}
    />
  );
}

// ─── Admin Inspection tour ──────────────────────────────

const INSPECTION_STEPS: Step[] = [
  {
    target: '[data-tour="inspection-progress"]',
    title: 'Progreso de la inspección',
    content:
      'La barra muestra cuántos ítems evaluaste del total. Cuando llegue al 100% podés generar el plan de mantenimiento automáticamente.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="inspection-sectors"]',
    title: 'Sectores de la vivienda',
    content:
      'Cada sector agrupa los puntos de inspección. Expandí uno para ver sus ítems. Podés agregar ítems personalizados si encontrás algo no listado.',
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="inspection-buttons"]',
    title: 'Evaluar cada ítem',
    content:
      'Tres opciones: ✅ OK (sin problemas), ⚠️ Necesita atención (problema menor), 🔴 Requiere profesional (problema serio). Al marcar atención o profesional, podés describir el hallazgo.',
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="inspection-guide"]',
    title: 'Guía de inspección',
    content:
      'El ícono del ojo muestra la guía detallada: qué buscar, cómo evaluar, procedimiento y normativa aplicable. Consultala antes de evaluar si tenés dudas.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function InspectionTour() {
  return (
    <Tour storageKey="epde-tour-inspection" steps={INSPECTION_STEPS} forRole={UserRole.ADMIN} />
  );
}

// ─── Admin Templates tour ───────────────────────────────

const TEMPLATES_STEPS: Step[] = [
  {
    target: '[data-tour="templates-categories"]',
    title: 'Categorías de mantenimiento',
    content:
      'Cada categoría agrupa tareas por tipo de trabajo: plomería, electricidad, estructura, etc. Creá las categorías primero y después asignales plantillas de tareas.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="templates-tasks"]',
    title: 'Plantillas de tareas',
    content:
      'Cada plantilla define: qué inspeccionar, con qué prioridad, cada cuánto tiempo, y si requiere profesional. Al crear un plan, estas plantillas se convierten en tareas reales.',
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="templates-guide"]',
    title: 'Guía de inspección',
    content:
      'El editor de guía define qué buscar, los criterios de evaluación (OK/Atención/Profesional), el procedimiento paso a paso y la normativa aplicable.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function TemplatesTour() {
  return <Tour storageKey="epde-tour-templates" steps={TEMPLATES_STEPS} forRole={UserRole.ADMIN} />;
}

// ─── Admin Clients tour ─────────────────────────────────

const CLIENTS_STEPS: Step[] = [
  {
    target: '[data-tour="clients-list"]',
    title: 'Lista de clientes',
    content:
      'Todos tus clientes con su estado (Activo, Invitado), cantidad de propiedades y último acceso. Usá la búsqueda para encontrar rápido.',
    skipBeacon: true,
    ...SHARED_STEP_DEFAULTS,
  },
  {
    target: '[data-tour="clients-invite"]',
    title: 'Invitar nuevo cliente',
    content:
      'El cliente recibe un email con un link para configurar su contraseña. Una vez activo, puede ver sus propiedades, completar tareas y solicitar servicios.',
    ...SHARED_STEP_DEFAULTS,
  },
];

export function ClientsTour() {
  return <Tour storageKey="epde-tour-clients" steps={CLIENTS_STEPS} forRole={UserRole.ADMIN} />;
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
  'epde-tour-admin-dashboard',
  'epde-tour-inspection',
  'epde-tour-templates',
  'epde-tour-clients',
];

export function resetOnboardingTour() {
  TOUR_KEYS.forEach((key) => localStorage.removeItem(key));
}
