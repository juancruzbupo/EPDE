import type { LucideIcon } from 'lucide-react';
import {
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
  { icon: Search, text: 'Diagnostica el estado real de tu vivienda' },
  { icon: ClipboardList, text: 'Organiza todo el mantenimiento que necesita' },
  { icon: Shield, text: 'Te ayuda a prevenir problemas antes de que aparezcan' },
  { icon: BarChart3, text: 'Te guía con datos para tomar mejores decisiones' },
];

export const STEPS: Step[] = [
  {
    number: '01',
    icon: Search,
    title: 'Relevamos tu vivienda',
    description:
      'Diagnóstico profesional completo: estructura, instalaciones, envolvente y estado general. Toda la información se carga en el sistema.',
  },
  {
    number: '02',
    icon: BarChart3,
    title: 'Analizamos el estado real',
    description:
      'Calculamos el Índice de Salud de la Vivienda (ISV): un indicador claro del estado actual y las prioridades de intervención.',
  },
  {
    number: '03',
    icon: ClipboardList,
    title: 'Organizamos todo el mantenimiento',
    description:
      'El sistema te dice qué hacer y cuándo hacerlo. Tareas programadas, recordatorios automáticos y seguimiento continuo.',
  },
];

export const SYSTEM_FEATURES: IconTextItem[] = [
  { icon: BarChart3, text: 'Dashboard de estado de la vivienda' },
  { icon: ClipboardList, text: 'Historial de intervenciones' },
  { icon: Bell, text: 'Alertas y recordatorios automáticos' },
  { icon: Wrench, text: 'Tareas programadas de mantenimiento' },
  { icon: Smartphone, text: 'Acceso web y mobile' },
  { icon: Search, text: 'Seguimiento del ISV mes a mes' },
];

export const INVESTMENT_FEATURES = [
  'Diagnóstico inicial completo de la vivienda',
  'Informe técnico imprimible',
  'Índice de Salud de la Vivienda (ISV)',
  'Plan de mantenimiento preventivo',
  'Detección de riesgos y tareas críticas',
  'Recomendaciones técnicas',
  'Acceso al sistema EPDE',
];

export const TARGET_PROFILES = [
  'Propietarios que quieren cuidar su casa sin tener que entender de construcción',
  'Familias que prefieren prevenir antes que reparar de urgencia',
  'Inversores que necesitan proteger el valor de sus propiedades',
  'Personas ocupadas que buscan delegar el seguimiento de su vivienda',
];

export const CREDENTIALS: IconTextItem[] = [
  { icon: Award, text: 'Arquitecta matriculada' },
  { icon: Search, text: 'Especialista en patologías edilicias' },
  { icon: Home, text: 'Foco en viviendas residenciales' },
  { icon: ClipboardList, text: 'Cada diagnóstico realizado personalmente' },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    aspect: 'Cuándo se actúa',
    traditional: 'Cuando algo se rompe',
    epde: 'Antes de que ocurra',
  },
  {
    aspect: 'Costo típico',
    traditional: 'Reparaciones de emergencia caras',
    epde: 'Intervenciones preventivas económicas',
  },
  {
    aspect: 'Planificación',
    traditional: 'No hay plan, se improvisa',
    epde: 'Sistema con tareas y recordatorios',
  },
  {
    aspect: 'Seguimiento',
    traditional: 'No existe',
    epde: 'Dashboard digital con historial e ISV',
  },
  {
    aspect: 'Criterio técnico',
    traditional: 'Se consulta al albañil cuando ya hay daño',
    epde: 'Diagnóstico profesional desde el día uno',
  },
];

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export const LAUNCH_PRICE = '$35.000';

export const PRICE_NOTE =
  'Válido para viviendas de tamaño estándar. Casas grandes o complejas pueden requerir evaluación adicional.';

export const SUBSCRIPTION_MICROCOPY =
  'Luego podés continuar con el monitoreo mensual si querés seguir manteniendo tu casa bajo control.';

export const COST_DISCLAIMER =
  'Costos estimados en base a valores promedio de mercado en Paraná actualizados a marzo 2026. Los valores pueden variar según cada caso.';

// ---------------------------------------------------------------------------
// CTA labels (unified across sections)
// ---------------------------------------------------------------------------

export const PRIMARY_CTA_LABEL = 'Pedir diagnóstico';

export const PHONE_NUMBER = '5493435043696';
export const PHONE_DISPLAY = '343 504-3696';
