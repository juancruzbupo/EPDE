import type { LucideIcon } from 'lucide-react';
import {
  Search,
  ClipboardList,
  MonitorSmartphone,
  Droplets,
  Zap,
  Thermometer,
  BarChart3,
  Bell,
  Smartphone,
  Home,
  Award,
  Wrench,
  FileText,
  Check,
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
  consequence: string;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const WHATSAPP_URL =
  'https://wa.me/5493001234567?text=Hola%20Noelia%2C%20quiero%20coordinar%20el%20diagn%C3%B3stico.';

export {
  Check,
  Search,
  ClipboardList,
  MonitorSmartphone,
  Droplets,
  Zap,
  Thermometer,
  Home,
  Wrench,
  Award,
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const PROBLEMS: ProblemCard[] = [
  {
    icon: Droplets,
    title: 'Filtraciones y humedades',
    description:
      'Sin revisión periódica, avanzan detrás de paredes y bajo pisos sin señales visibles.',
    consequence: 'Lo que era un ajuste puntual termina comprometiendo el valor de tu propiedad.',
  },
  {
    icon: Zap,
    title: 'Instalaciones sin supervisión',
    description: 'Cañerías, cables y conexiones envejecen sin que nadie lo controle.',
    consequence:
      'El ahorro preventivo se pierde: lo que costaba poco ahora requiere obra completa.',
  },
  {
    icon: Thermometer,
    title: 'Fisuras no monitoreadas',
    description: 'Los ciclos térmicos generan micro-fisuras que crecen año tras año.',
    consequence: 'Sin seguimiento técnico, se pierde la ventana de corrección temprana.',
  },
];

export const DETECTED_PROBLEMS: IconTextItem[] = [
  { icon: Droplets, text: 'Humedades ocultas en muros y cubiertas' },
  { icon: Home, text: 'Fisuras estructurales' },
  { icon: Wrench, text: 'Impermeabilizaciones deterioradas' },
  { icon: Zap, text: 'Instalaciones que nunca fueron revisadas' },
  { icon: Search, text: 'Desgaste en cubiertas, sellados y desagües' },
];

export const STEPS: Step[] = [
  {
    number: '01',
    icon: Search,
    title: 'Evaluación in situ',
    description: 'Evaluamos tu vivienda: estructura, instalaciones, envolvente y estado general.',
  },
  {
    number: '02',
    icon: ClipboardList,
    title: 'Diagnóstico documentado',
    description:
      'Informe con hallazgos, prioridades y plan de acción personalizado. No es una lista de tareas. Es una estrategia técnica adaptada a tu vivienda.',
  },
  {
    number: '03',
    icon: MonitorSmartphone,
    title: 'Seguimiento digital',
    description:
      'Tu plan se carga en EPDE con tareas programadas y recordatorios automáticos. Tu vivienda deja de depender de recordatorios mentales.',
  },
];

export const DELIVERABLES: IconTextItem[] = [
  { icon: Search, text: 'Evaluación técnica presencial de la vivienda' },
  { icon: FileText, text: 'Informe de diagnóstico con hallazgos y prioridades' },
  { icon: ClipboardList, text: 'Plan de mantenimiento preventivo personalizado' },
  { icon: MonitorSmartphone, text: 'Carga completa en plataforma digital EPDE' },
  { icon: Bell, text: 'Recordatorios automáticos de tareas programadas' },
  { icon: BarChart3, text: 'Historial estructurado de intervenciones' },
  { icon: Smartphone, text: 'Acceso web y mobile para seguimiento continuo' },
  { icon: Wrench, text: 'Recomendaciones de proveedores y presupuestos orientativos' },
];

export const INVESTMENT_FEATURES = [
  'Evaluación técnica presencial completa',
  'Informe de diagnóstico con hallazgos y prioridades',
  'Plan de mantenimiento preventivo personalizado',
  'Carga en plataforma digital con seguimiento',
  'Revisión anual incluida en etapa de lanzamiento',
];

export const TARGET_PROFILES = [
  'Tienen vivienda unifamiliar propia',
  'Prefieren planificar antes que reaccionar',
  'Buscan orden y previsión en el mantenimiento',
  'Valoran criterio profesional sobre soluciones improvisadas',
];

export const CREDENTIALS: IconTextItem[] = [
  { icon: Award, text: 'Arquitecta matriculada' },
  { icon: Search, text: 'Especialista en patologías edilicias' },
  { icon: Home, text: 'Foco en viviendas unifamiliares' },
  { icon: ClipboardList, text: 'Cada diagnóstico realizado personalmente' },
];
