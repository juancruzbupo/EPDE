import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  Check,
  ClipboardList,
  Droplets,
  FileText,
  Home,
  MonitorSmartphone,
  Search,
  Shield,
  Smartphone,
  Thermometer,
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
  AlertTriangle,
  Award,
  Check,
  ClipboardList,
  Droplets,
  Home,
  MonitorSmartphone,
  Search,
  Shield,
  Thermometer,
  Wrench,
  Zap,
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
  {
    number: '04',
    icon: Bell,
    title: 'Seguimiento periódico',
    description:
      'Recordatorios automáticos, historial de intervenciones y acceso permanente desde web y mobile. Tu vivienda siempre bajo control.',
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
  'Inspección técnica completa de la vivienda',
  'Registro fotográfico de hallazgos',
  'Informe técnico con diagnóstico y prioridades',
  'Recomendaciones de mantenimiento preventivo',
  'Carga en plataforma digital con seguimiento',
];

export const TARGET_PROFILES = [
  'Tienen vivienda unifamiliar propia',
  'Prefieren planificar antes que reaccionar',
  'Buscan orden y previsión en el mantenimiento',
  'Valoran criterio profesional sobre soluciones improvisadas',
];

export const INSPECTION_AREAS = [
  'Estado de techos y cubiertas',
  'Filtraciones y humedad',
  'Fisuras y grietas estructurales',
  'Instalaciones sanitarias',
  'Instalaciones eléctricas',
  'Estado general de mantenimiento',
];

export const CREDENTIALS: IconTextItem[] = [
  { icon: Award, text: 'Arquitecta matriculada' },
  { icon: Search, text: 'Especialista en patologías edilicias' },
  { icon: Home, text: 'Foco en viviendas unifamiliares' },
  { icon: ClipboardList, text: 'Cada diagnóstico realizado personalmente' },
];

// ---------------------------------------------------------------------------
// Repair costs (source: docs/actualizacion-costos.md)
// ---------------------------------------------------------------------------

export interface RepairCost {
  icon: LucideIcon;
  problem: string;
  consequence: string;
  repairRange: string;
}

export const REPAIR_COSTS: RepairCost[] = [
  {
    icon: Droplets,
    problem: 'Filtración en techo',
    consequence:
      'Si no se detecta a tiempo puede generar humedad estructural, daño en cielorraso y moho.',
    repairRange: '$2.500.000 – $6.000.000',
  },
  {
    icon: Home,
    problem: 'Humedad de cimientos',
    consequence: 'Deterioro de revoques, daño estructural y pérdida de valor de la propiedad.',
    repairRange: '$3.500.000 – $9.000.000',
  },
  {
    icon: Zap,
    problem: 'Falla eléctrica sin diagnóstico',
    consequence: 'Recableado parcial, daños en paredes y riesgo de incendio.',
    repairRange: '$1.200.000 – $3.500.000',
  },
];

// ---------------------------------------------------------------------------
// Cost comparison (preventive vs emergency)
// ---------------------------------------------------------------------------

export interface CostComparison {
  pathology: string;
  preventive: string;
  emergency: string;
  multiplier: string;
}

export const COST_COMPARISONS: CostComparison[] = [
  {
    pathology: 'Filtraciones en techos',
    preventive: '$150.000 – $400.000',
    emergency: '$2.500.000 – $6.000.000',
    multiplier: '8x – 15x',
  },
  {
    pathology: 'Humedad de cimientos',
    preventive: '$300.000 – $800.000',
    emergency: '$3.500.000 – $9.000.000',
    multiplier: '8x – 12x',
  },
  {
    pathology: 'Fallas eléctricas',
    preventive: '$80.000 – $180.000',
    emergency: '$1.200.000 – $3.500.000',
    multiplier: '10x – 20x',
  },
];

// ---------------------------------------------------------------------------
// Price tiers by m²
// ---------------------------------------------------------------------------

export interface PriceTier {
  label: string;
  range: string;
}

export const PRICE_TIERS: PriceTier[] = [
  { label: 'Hasta 60 m²', range: 'desde $150.000' },
  { label: '60 a 120 m²', range: 'desde $250.000' },
  { label: '120 a 200 m²', range: 'presupuesto personalizado' },
];

// ---------------------------------------------------------------------------
// Disclaimers
// ---------------------------------------------------------------------------

export const COST_DISCLAIMER =
  'Costos estimados en base a valores promedio de mercado en Paraná (materiales y mano de obra) actualizados a marzo 2026. Los valores pueden variar según cada caso.';

export const PRICE_DISCLAIMER =
  'El valor depende del tamaño de la vivienda y del estado general del mantenimiento. Los valores son orientativos y se confirman tras la consulta inicial.';
