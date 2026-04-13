'use client';

import { UserRole } from '@epde/shared';
import type { Step } from 'react-joyride';

import { SHARED_STEP_DEFAULTS, Tour } from './tour-core';

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
