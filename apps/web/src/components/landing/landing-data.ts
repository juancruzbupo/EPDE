import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  BarChart3,
  Bell,
  Building2,
  Check,
  ClipboardList,
  Droplets,
  HardHat,
  Home,
  MonitorSmartphone,
  Search,
  Shield,
  Smartphone,
  Thermometer,
  TrendingDown,
  Wrench,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface IconTextItem {
  icon: LucideIcon;
  text: string;
}

export interface ProblemCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface SectionProps {
  motionProps: Record<string, unknown>;
}

export interface ComparisonRow {
  aspect: string;
  traditional: string;
  epde: string;
}

export interface ConsequenceExample {
  problem: string;
  preventive: string;
  emergency: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WHATSAPP_PLACEHOLDER =
  'https://wa.me/5493001234567?text=Hola%2C%20quiero%20saber%20c%C3%B3mo%20est%C3%A1%20mi%20casa%20y%20evitar%20problemas%20a%20futuro';

/** WhatsApp CTA URL. Set NEXT_PUBLIC_WHATSAPP_URL in production to override placeholder. */
export const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || WHATSAPP_PLACEHOLDER;

export {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  BarChart3,
  Bell,
  Check,
  ClipboardList,
  Droplets,
  Home,
  MonitorSmartphone,
  Search,
  Shield,
  Smartphone,
  Thermometer,
  TrendingDown,
  Wrench,
  Zap,
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const MARKET_PROBLEMS: ProblemCard[] = [
  {
    icon: Droplets,
    title: 'Deterioro invisible',
    description:
      'Filtraciones y humedad avanzan detrás de paredes sin señales visibles. Cuando aparecen, el daño ya es caro.',
  },
  {
    icon: Zap,
    title: 'Instalaciones sin control',
    description:
      'Cables, cañerías y conexiones envejecen sin que nadie los revise. El riesgo crece cada año.',
  },
  {
    icon: Thermometer,
    title: 'Mantenimiento inexistente',
    description:
      'La mayoría de las casas no tienen un plan. Los problemas se acumulan hasta que son urgentes.',
  },
  {
    icon: Wrench,
    title: 'Problemas que aparecen tarde',
    description:
      'Lo que hoy se resuelve con una intervención menor, mañana requiere obra completa.',
  },
];

export const CONSEQUENCE_EXAMPLES: ConsequenceExample[] = [
  {
    problem: 'Filtración en techo',
    preventive: '$150.000 – $400.000',
    emergency: '$2.500.000 – $6.000.000',
  },
  {
    problem: 'Humedad de cimientos',
    preventive: '$300.000 – $800.000',
    emergency: '$3.500.000 – $9.000.000',
  },
  {
    problem: 'Falla eléctrica',
    preventive: '$80.000 – $180.000',
    emergency: '$1.200.000 – $3.500.000',
  },
];

export const SOLUTION_POINTS: IconTextItem[] = [
  { icon: Search, text: 'Diagnostica el estado real de tu casa' },
  { icon: ClipboardList, text: 'Organiza todo el mantenimiento que necesita' },
  { icon: Shield, text: 'Te ayuda a prevenir problemas antes de que aparezcan' },
  { icon: BarChart3, text: 'Te da datos claros para tomar mejores decisiones' },
];

export const STEPS: Step[] = [
  {
    number: '01',
    icon: Search,
    title: 'Visitamos tu casa',
    description:
      'La arquitecta recorre y documenta todo: estructura, instalaciones (agua, luz, gas), paredes, techos y estado general. Cargamos la información en el sistema.',
  },
  {
    number: '02',
    icon: BarChart3,
    title: 'Analizamos el estado real',
    description:
      'Calculamos el ISV (Índice de Salud de tu Vivienda): un puntaje del 0 al 100 que muestra de un vistazo cómo está tu casa y qué conviene hacer primero.',
  },
  {
    number: '03',
    icon: ClipboardList,
    title: 'Organizamos todo el mantenimiento',
    description:
      'El sistema te avisa qué hacer y cuándo. Tareas agendadas, recordatorios automáticos y seguimiento continuo mes a mes.',
  },
];

export const SYSTEM_FEATURES: IconTextItem[] = [
  { icon: BarChart3, text: 'Panel con el estado general de tu casa' },
  { icon: ClipboardList, text: 'Historial de trabajos realizados' },
  { icon: Bell, text: 'Alertas y recordatorios automáticos' },
  { icon: Wrench, text: 'Tareas de mantenimiento agendadas' },
  { icon: Smartphone, text: 'Acceso desde computadora o celular' },
  { icon: Search, text: 'Seguimiento del puntaje ISV mes a mes' },
];

export const INVESTMENT_FEATURES = [
  'Diagnóstico inicial completo de tu casa (visita + análisis)',
  'Informe técnico imprimible',
  'Puntaje ISV (Índice de Salud de tu Vivienda, del 0 al 100)',
  'Plan de mantenimiento preventivo personalizado',
  'Detección de riesgos y tareas urgentes',
  'Recomendaciones técnicas',
  '6 meses de acceso al sistema EPDE',
  'Llamada de seguimiento a los 30 días',
  'Re-diagnóstico + actualización del ISV a los 6 meses',
  'Certificado de Mantenimiento al cumplir 1 año (bonus)',
];

export const TARGET_PROFILES = [
  'Propietarios que quieren cuidar su casa sin tener que saber de construcción',
  'Familias que prefieren prevenir antes que reparar de urgencia',
  'Quienes tienen más de una propiedad y quieren proteger su valor',
  'Personas ocupadas que no quieren estar encima del mantenimiento',
];

export const CREDENTIALS: IconTextItem[] = [
  { icon: Award, text: 'Arquitecta matriculada' },
  { icon: Building2, text: 'Matrícula municipal habilitada' },
  { icon: HardHat, text: 'Representante técnica con experiencia' },
  { icon: Home, text: 'Enfocada en casas y departamentos' },
];

/**
 * Competencias del posgrado oficial (Facultad de Arquitectura, UBA).
 * Usadas en el popover de la credencial "Especialista en Patologías y
 * Terapéuticas de la Construcción" para que el cliente crítico pueda
 * verificar qué enseña exactamente esa formación.
 */
export const PATOLOGIAS_COMPETENCIAS: string[] = [
  'Diagnosticar las causas de las lesiones, daños o deterioros en las construcciones.',
  'Evaluar el grado de deterioro de las construcciones.',
  'Diseñar procedimientos de intervención para corregir los problemas identificados.',
  'Valorar y respetar desde el punto de vista patrimonial los bienes en los que interviene.',
  'Asesorar en la prevención y el mantenimiento de obras civiles.',
  'Incorporar el conocimiento de patologías en proyectos nuevos, con carácter preventivo.',
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    aspect: 'Cuándo intervenir',
    traditional: 'Cuando algo se rompe',
    epde: 'Antes de que ocurra',
  },
  {
    aspect: 'Costo típico',
    traditional: 'Reparaciones de urgencia caras',
    epde: 'Trabajos preventivos de bajo costo',
  },
  {
    aspect: 'Planificación',
    traditional: 'No hay plan, se improvisa',
    epde: 'Sistema con tareas y recordatorios',
  },
  {
    aspect: 'Seguimiento',
    traditional: 'No existe',
    epde: 'Panel digital con historial y puntaje ISV',
  },
  {
    aspect: 'Criterio técnico',
    traditional: 'Se busca un profesional cuando ya hay daño',
    epde: 'Diagnóstico profesional desde el día uno',
  },
];

// ---------------------------------------------------------------------------
// Pricing — tiers por superficie (igual lógica que inspecciones técnicas)
// ---------------------------------------------------------------------------

/**
 * Tiers del plan EPDE según superficie. Cortes alineados con los de
 * inspecciones técnicas para consistencia. Precio launch = introductorio
 * (primeros 20 clientes); precio target = post-validación.
 *
 * Justificación: un plan único $35k sub-cotizaba casas grandes (6h+ de
 * trabajo) y sobre-cotizaba deptos chicos. Además estaba por debajo del
 * precio de la Inspección básica ($114k aparte), generando incoherencia
 * comercial interna. Esta estructura alinea valor↔precio↔complejidad.
 */
export interface PlanPriceTier {
  id: 'SMALL' | 'MEDIUM' | 'LARGE';
  label: string;
  range: string;
  maxSqm: number | null;
  launch: number;
  target: number;
}

export const PLAN_PRICE_TIERS: PlanPriceTier[] = [
  {
    id: 'SMALL',
    label: 'Plan Chico',
    range: 'Hasta 100 m²',
    maxSqm: 100,
    launch: 55000,
    target: 85000,
  },
  {
    id: 'MEDIUM',
    label: 'Plan Estándar',
    range: '100 a 200 m²',
    maxSqm: 200,
    launch: 75000,
    target: 120000,
  },
  {
    id: 'LARGE',
    label: 'Plan Amplio',
    range: '200 a 350 m²',
    maxSqm: 350,
    launch: 110000,
    target: 180000,
  },
];

export const PLAN_OVERSIZED_THRESHOLD_SQM = 350;

/** Backwards compat — sigue usándose como "desde" en CTAs hero/final. */
export const LAUNCH_PRICE = '$55.000';

export const PRICE_NOTE =
  'El precio final depende de la superficie de tu propiedad. Casas de más de 350 m² o con accesos complicados se cotizan aparte.';

export const SUBSCRIPTION_MICROCOPY =
  'Pasados los 6 meses, podés continuar con un plan mensual opcional si querés seguir con el seguimiento. No es obligatorio.';

export const COST_DISCLAIMER =
  'Costos estimados a partir de valores promedio del mercado en Paraná (Entre Ríos), actualizados a abril 2026. Los valores finales pueden variar según cada caso.';

export const LAUNCH_URGENCY_BANNER =
  'Precio de lanzamiento vigente hasta completar los primeros 20 clientes. Después: +60%.';

// ---------------------------------------------------------------------------
// CTA labels (unified across sections)
// ---------------------------------------------------------------------------

export const PRIMARY_CTA_LABEL = 'Pedir diagnóstico';

export const PHONE_NUMBER = '5493435043696';
export const PHONE_DISPLAY = '343 504-3696';
