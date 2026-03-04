'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Check,
  Search,
  ClipboardList,
  MonitorSmartphone,
  User,
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
} from 'lucide-react';
import {
  fadeIn,
  fadeInUp,
  scaleIn,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
  useMotionPreference,
} from '@/lib/motion';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WHATSAPP_URL =
  'https://wa.me/5493001234567?text=Hola%20Noelia%2C%20quiero%20coordinar%20el%20diagn%C3%B3stico.';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IconTextItem {
  icon: LucideIcon;
  text: string;
}

interface ProblemCard {
  icon: LucideIcon;
  title: string;
  description: string;
  consequence: string;
}

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

interface CostComparison {
  icon: LucideIcon;
  pathology: string;
  preventive: string;
  emergency: string;
  multiplier: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PROBLEMS: ProblemCard[] = [
  {
    icon: Droplets,
    title: 'Filtraciones y humedades',
    description:
      'Sin revisión periódica, avanzan detrás de paredes y bajo pisos sin señales visibles.',
    consequence: 'Lo que era una corrección menor se convierte en intervención completa.',
  },
  {
    icon: Zap,
    title: 'Instalaciones sin supervisión',
    description: 'Cañerías, cables y conexiones envejecen sin que nadie lo controle.',
    consequence: 'Los problemas aparecen cuando ya requieren intervención mayor.',
  },
  {
    icon: Thermometer,
    title: 'Fisuras no monitoreadas',
    description: 'Los ciclos térmicos generan micro-fisuras que crecen año tras año.',
    consequence: 'Sin seguimiento técnico, se pierde la ventana de corrección temprana.',
  },
];

const STEPS: Step[] = [
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

const CASE_STUDY = {
  context:
    'Vivienda unifamiliar de 15 años en zona suburbana. Los propietarios no detectaban ningún problema visible.',
  problem:
    'El diagnóstico reveló: humedad ascendente en muro medianero (no visible por revestimiento), fisuras activas en losa de terraza y cañería de gas con pérdida micro en conexión de cocina.',
  result:
    'Todas las intervenciones se resolvieron de forma preventiva, antes de que generaran daños mayores. Costo total de las correcciones: una fracción de lo que hubiera costado la reparación de emergencia.',
  savings: 'Ahorro estimado: $2.800.000+',
};

const COST_COMPARISONS: CostComparison[] = [
  {
    icon: Droplets,
    pathology: 'Filtraciones en techos',
    preventive: '$150.000 – $400.000',
    emergency: '$2.500.000 – $6.000.000',
    multiplier: '8x – 15x',
  },
  {
    icon: Thermometer,
    pathology: 'Humedad de cimientos',
    preventive: '$300.000 – $800.000',
    emergency: '$3.500.000 – $9.000.000',
    multiplier: '8x – 12x',
  },
  {
    icon: Zap,
    pathology: 'Fallas eléctricas',
    preventive: '$80.000 – $180.000',
    emergency: '$1.200.000 – $3.500.000',
    multiplier: '10x – 20x',
  },
];

const DELIVERABLES: IconTextItem[] = [
  { icon: Search, text: 'Evaluación técnica presencial de la vivienda' },
  { icon: FileText, text: 'Informe de diagnóstico con hallazgos y prioridades' },
  { icon: ClipboardList, text: 'Plan de mantenimiento preventivo personalizado' },
  { icon: MonitorSmartphone, text: 'Carga completa en plataforma digital EPDE' },
  { icon: Bell, text: 'Recordatorios automáticos de tareas programadas' },
  { icon: BarChart3, text: 'Historial estructurado de intervenciones' },
  { icon: Smartphone, text: 'Acceso web y mobile para seguimiento continuo' },
  { icon: Wrench, text: 'Recomendaciones de proveedores y presupuestos orientativos' },
];

const PRICING = [
  {
    label: 'Vivienda compacta',
    range: 'Hasta 70 m²',
    price: 'AR$ 240.000',
    note: 'Ideal para departamentos o viviendas pequeñas.',
    featured: false,
  },
  {
    label: 'Vivienda estándar',
    range: '70 a 140 m²',
    price: 'AR$ 290.000',
    note: 'La mayoría de las viviendas unifamiliares se encuentran en este rango.',
    featured: true,
  },
  {
    label: 'Vivienda ampliada',
    range: 'Más de 140 m²',
    price: 'Desde AR$ 350.000',
    note: 'Evaluación personalizada según complejidad.',
    featured: false,
  },
];

const TARGET_PROFILES = [
  'Tienen vivienda unifamiliar propia',
  'Prefieren planificar antes que reaccionar',
  'Buscan orden y previsión en el mantenimiento',
  'Valoran criterio profesional sobre soluciones improvisadas',
];

const CREDENTIALS: IconTextItem[] = [
  { icon: Award, text: 'Arquitecta matriculada' },
  { icon: Search, text: 'Especialista en patologías edilicias' },
  { icon: Home, text: 'Foco en viviendas unifamiliares' },
  { icon: ClipboardList, text: 'Cada diagnóstico realizado personalmente' },
];

const LAUNCH_BENEFITS = [
  'Valor preferencial de lanzamiento',
  'Revisión anual incluida sin cargo adicional',
  'Acceso prioritario a nuevas funcionalidades',
  'Comunicación directa con la arquitecta',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { shouldAnimate } = useMotionPreference();

  const ctaHref = isLoading ? '/login' : isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? 'Ir al Dashboard' : 'Iniciar Sesión';

  const motionProps = shouldAnimate
    ? {
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport: { once: true, margin: '-60px' },
      }
    : {};

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      {/* ==================== Header ==================== */}
      <header className="border-border/50 bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="font-heading text-primary text-xl">EPDE</span>
          <Link href={ctaHref}>
            <Button variant="ghost" size="sm">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </header>

      {/* ==================== 1. Hero ==================== */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-28">
        <motion.div
          variants={staggerContainer}
          {...motionProps}
          className="mx-auto max-w-5xl px-4 text-center"
        >
          <motion.h1
            variants={fadeInUp}
            className="font-heading text-foreground text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Tu vivienda merece algo más que mantenimiento.
            <br />
            <span className="text-primary">Merece planificación profesional.</span>
          </motion.h1>

          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-6 max-w-2xl"
          >
            Sistema de diagnóstico y mantenimiento preventivo con criterio arquitectónico y
            seguimiento digital real.
          </motion.p>

          <motion.p variants={fadeIn} className="type-body-md text-muted-foreground/50 mt-3 italic">
            Porque lo que no se planifica, se deteriora.
          </motion.p>

          <motion.div variants={fadeIn} className="mt-10 flex justify-center">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                Quiero evaluar mi vivienda
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== 2. Problema ==================== */}
      <section className="bg-muted/30 py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-5xl px-4">
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground text-3xl tracking-tight sm:text-4xl"
          >
            El problema no es el paso del tiempo.
            <br />
            <span className="text-muted-foreground">Es no tener sistema.</span>
          </motion.h2>
          <motion.div
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mt-4 max-w-2xl space-y-4"
          >
            <p>
              Las filtraciones no empiezan siendo urgencias. Las instalaciones no fallan de un día
              para el otro. El deterioro es progresivo, invisible y acumulativo.
            </p>
            <p>
              Cada mes que pasa sin revisión, el costo de la solución crece. Lo que hoy se resuelve
              con una intervención menor, mañana requiere obra completa.
            </p>
            <p>Postergar no es ahorrar. Es acumular riesgo.</p>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <motion.div
                key={problem.title}
                variants={staggerItem}
                className="border-border bg-card rounded-xl border p-6"
              >
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                  <problem.icon className="text-foreground/60 h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="type-title-md text-foreground mt-4">{problem.title}</h3>
                <p className="type-body-md text-muted-foreground mt-2">{problem.description}</p>
                <p className="type-body-sm text-foreground/70 mt-3 font-medium">
                  {problem.consequence}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-10 max-w-2xl text-center"
          >
            La diferencia entre una intervención menor y una obra mayor es, casi siempre,{' '}
            <span className="text-foreground font-medium">haber actuado a tiempo.</span>
          </motion.p>
        </motion.div>
      </section>

      {/* ==================== 3. Cómo funciona ==================== */}
      <section id="como-funciona" className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <motion.p
              variants={fadeIn}
              className="type-label-md text-primary tracking-widest uppercase"
            >
              Cómo funciona
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
            >
              No es solo un informe.
              <br />
              <span className="text-muted-foreground">Es un sistema completo.</span>
            </motion.h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <motion.div key={step.number} variants={staggerItem}>
                <span className="font-heading text-primary/20 text-5xl">{step.number}</span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                    <step.icon className="text-primary h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <h3 className="type-title-md text-foreground">{step.title}</h3>
                </div>
                <p className="type-body-md text-muted-foreground mt-3">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ==================== 4. Así se ve el sistema ==================== */}
      <section className="bg-muted/30 py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <motion.p
              variants={fadeIn}
              className="type-label-md text-primary tracking-widest uppercase"
            >
              La plataforma
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
            >
              Así se ve el sistema EPDE.
            </motion.h2>
          </div>

          <motion.div
            variants={scaleIn}
            className="mt-10 flex items-center justify-center gap-6 md:gap-10"
          >
            {/* Web screenshot */}
            <div className="border-border overflow-hidden rounded-xl border shadow-sm">
              <Image
                src="/images/demo-web.png"
                alt="Panel de usuario EPDE — vista web"
                width={920}
                height={449}
                className="h-auto w-[280px] sm:w-[400px] md:w-[520px] lg:w-[600px]"
                priority
              />
            </div>
            {/* Mobile screenshot */}
            <div className="border-border overflow-hidden rounded-2xl border shadow-sm">
              <Image
                src="/images/demo-mobile.jpg"
                alt="Panel de usuario EPDE — vista mobile"
                width={375}
                height={812}
                className="h-auto w-[100px] sm:w-[130px] md:w-[160px] lg:w-[180px]"
                priority
              />
            </div>
          </motion.div>

          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-8 max-w-2xl text-center"
          >
            Cada vivienda cuenta con su panel de seguimiento, historial técnico y planificación
            anual.
          </motion.p>
        </motion.div>
      </section>

      {/* ==================== 5. Caso real ==================== */}
      <section className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Caso ilustrativo
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Un diagnóstico. Tres problemas resueltos.
          </motion.h2>

          <motion.div
            variants={fadeInUp}
            className="border-border bg-card mt-10 overflow-hidden rounded-xl border"
          >
            <div className="border-l-primary/30 border-l-4 p-6 sm:p-8">
              <p className="type-label-md text-primary tracking-wide uppercase">Contexto</p>
              <p className="type-body-lg text-foreground mt-2">{CASE_STUDY.context}</p>
            </div>
            <div className="bg-border h-px" />
            <div className="border-l-destructive/50 border-l-4 p-6 sm:p-8">
              <p className="type-label-md text-destructive tracking-wide uppercase">
                Problemas detectados
              </p>
              <p className="type-body-lg text-foreground mt-2">{CASE_STUDY.problem}</p>
            </div>
            <div className="bg-border h-px" />
            <div className="border-l-success border-l-4 p-6 sm:p-8">
              <p className="type-label-md text-success tracking-wide uppercase">
                Resultado preventivo
              </p>
              <p className="type-body-lg text-foreground mt-2">{CASE_STUDY.result}</p>
              <p className="type-title-md text-success mt-3">{CASE_STUDY.savings}</p>
            </div>
          </motion.div>

          <motion.p
            variants={fadeIn}
            className="type-body-sm text-muted-foreground/60 mt-4 text-center italic"
          >
            Caso ilustrativo basado en situaciones reales. No representa un cliente específico.
          </motion.p>
        </motion.div>
      </section>

      {/* ==================== 6. Comparación económica ==================== */}
      <section className="bg-muted/30 py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <motion.p
              variants={fadeIn}
              className="type-label-md text-primary tracking-widest uppercase"
            >
              Comparativa de costos
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
            >
              Prevención vs. emergencia:
              <br />
              <span className="text-muted-foreground">los números en Paraná.</span>
            </motion.h2>
            <motion.p
              variants={fadeIn}
              className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
            >
              Costos reales de las tres patologías más frecuentes en viviendas unifamiliares de la
              región. La diferencia entre actuar a tiempo y esperar se mide en millones.
            </motion.p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {COST_COMPARISONS.map((item) => (
              <motion.div
                key={item.pathology}
                variants={staggerItem}
                className="border-border bg-card overflow-hidden rounded-xl border"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                      <item.icon className="text-foreground/60 h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <h3 className="type-title-md text-foreground">{item.pathology}</h3>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="bg-success/5 rounded-lg p-3">
                      <p className="type-body-sm text-success font-medium tracking-wide uppercase">
                        Prevención
                      </p>
                      <p className="text-foreground mt-1 text-lg font-bold">{item.preventive}</p>
                    </div>
                    <div className="bg-destructive/5 rounded-lg p-3">
                      <p className="type-body-sm text-destructive font-medium tracking-wide uppercase">
                        Emergencia
                      </p>
                      <p className="text-foreground mt-1 text-lg font-bold">{item.emergency}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 border-border border-t px-6 py-3 text-center">
                  <p className="type-body-sm text-muted-foreground">
                    Reparar tarde cuesta{' '}
                    <span className="text-foreground font-bold">{item.multiplier}</span> más
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            variants={fadeIn}
            className="type-body-xs text-muted-foreground/60 mx-auto mt-8 max-w-3xl text-center"
          >
            Valores expresados en Pesos Argentinos, actualizados a marzo 2026. Los montos son
            ilustrativos basados en costos medios de construcción en la región de Entre Ríos y
            relevamientos propios de EPDE. El ahorro real se determinará tras el diagnóstico
            presencial profesional.
          </motion.p>
        </motion.div>
      </section>

      {/* ==================== 7. Qué incluye ==================== */}
      <section className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Qué incluye
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Todo lo que necesitás
            <br />
            <span className="text-muted-foreground">en un solo servicio.</span>
          </motion.h2>

          <motion.div
            variants={fadeIn}
            className="border-border bg-card mt-10 rounded-xl border p-6 sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {DELIVERABLES.map((item) => (
                <motion.div
                  key={item.text}
                  variants={staggerItem}
                  className="flex items-start gap-3"
                >
                  <div className="bg-primary/10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    <item.icon className="text-primary h-3.5 w-3.5" strokeWidth={1.5} />
                  </div>
                  <span className="type-body-lg text-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.p
            variants={fadeIn}
            className="type-body-md text-foreground/70 mt-6 text-center italic"
          >
            Desde el día uno, tu vivienda deja de estar librada al azar.
          </motion.p>
        </motion.div>
      </section>

      {/* ==================== 8. Inversión ==================== */}
      <section id="inversion" className="bg-muted/30 py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <motion.p
              variants={fadeIn}
              className="type-label-md text-primary tracking-widest uppercase"
            >
              Inversión según superficie
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
            >
              Sistema profesional adaptado a cada vivienda
            </motion.h2>
            <motion.p variants={fadeIn} className="type-body-lg text-muted-foreground mt-4">
              El alcance del diagnóstico varía según los metros cuadrados y la complejidad técnica
              de la vivienda. Por eso trabajamos con tramos definidos.
            </motion.p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {PRICING.map((tier) => (
              <motion.div
                key={tier.label}
                variants={staggerItem}
                className={cn(
                  'rounded-2xl p-8 text-center',
                  tier.featured
                    ? 'border-primary bg-primary/[0.03] border-2 shadow-sm'
                    : 'border-border bg-card border',
                )}
              >
                <p
                  className={cn(
                    'type-body-sm tracking-wide uppercase',
                    tier.featured ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {tier.label}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">{tier.range}</p>
                <h3
                  className={cn(
                    'font-heading text-foreground mt-6',
                    tier.featured ? 'text-5xl' : 'text-4xl',
                  )}
                >
                  {tier.price}
                </h3>
                <p className="type-body-sm text-muted-foreground mt-4">{tier.note}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeIn} className="mx-auto mt-12 max-w-xl text-center">
            <p className="type-body-md text-foreground/80">
              Etapa fundacional limitada a 10 viviendas unifamiliares en Paraná. Una vez completados
              los cupos, los valores se actualizarán.
            </p>
            <p className="type-body-sm text-muted-foreground mt-4">
              ¿No estás seguro de los metros de tu vivienda? Te ayudamos a estimarlo en la consulta
              inicial.
            </p>
          </motion.div>

          <motion.div variants={fadeIn} className="mt-10 text-center">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                Consultar disponibilidad
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== 9. ¿Es para vos? ==================== */}
      <section className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground text-3xl tracking-tight sm:text-4xl"
          >
            Este servicio es para propietarios que:
          </motion.h2>

          <div className="mt-8 space-y-4">
            {TARGET_PROFILES.map((profile) => (
              <motion.div key={profile} variants={staggerItem} className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <Check className="text-primary h-3.5 w-3.5" />
                </div>
                <span className="type-body-lg text-foreground">{profile}</span>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeIn} className="type-body-md text-foreground mt-6 font-medium">
            Personas que entienden que prevenir es una decisión inteligente.
          </motion.p>

          <motion.p variants={fadeIn} className="type-body-md text-muted-foreground mt-4">
            No es para resolver una gotera puntual ni para casas en alquiler temporario. Es un
            sistema de prevención para quienes cuidan su patrimonio con visión de largo plazo.
          </motion.p>
        </motion.div>
      </section>

      {/* ==================== 10. Autoridad ==================== */}
      <section className="bg-muted/30 py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Quién está detrás
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Criterio profesional,
            <br />
            <span className="text-muted-foreground">no un algoritmo.</span>
          </motion.h2>

          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
            <motion.div
              variants={slideInLeft}
              className="flex shrink-0 justify-center md:justify-start"
            >
              <div className="bg-primary/10 flex h-32 w-32 items-center justify-center rounded-2xl">
                <User className="text-primary/40 h-16 w-16" />
              </div>
            </motion.div>

            <motion.div variants={slideInRight} className="space-y-4">
              <p className="type-body-lg text-foreground">
                Soy <span className="font-medium">Noelia E. Yuskowich</span>, arquitecta. Creé EPDE
                porque no existía un sistema profesional de prevención para viviendas unifamiliares.
              </p>
              <p className="type-body-md text-muted-foreground">
                Durante años vi cómo pequeños problemas se convertían en intervenciones mayores por
                falta de planificación. EPDE nace para cambiar eso.
              </p>
              <p className="type-body-md text-muted-foreground">
                Cada diagnóstico lo realizo personalmente. No uso checklists genéricos: evalúo con
                criterio arquitectónico, adaptado a cada vivienda.
              </p>

              <p className="type-body-sm text-primary/70 font-medium">
                Sistema desarrollado a partir de años de experiencia en diagnóstico edilicio y
                validado con propietarios reales en Paraná.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {CREDENTIALS.map((cred) => (
                  <div key={cred.text} className="flex items-center gap-2">
                    <cred.icon className="text-primary h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span className="type-body-sm text-foreground">{cred.text}</span>
                  </div>
                ))}
              </div>

              <p className="text-foreground/80 type-body-md pt-2 italic">
                &ldquo;Una vivienda no solo se construye. Se cuida con sistema.&rdquo;
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ==================== 11. Lanzamiento ==================== */}
      <section id="agendar" className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.div
            variants={fadeInUp}
            className="border-primary/20 bg-primary/[0.02] rounded-xl border-2 p-8 sm:p-12"
          >
            <div className="text-center">
              <p className="type-label-md text-primary tracking-widest uppercase">
                Etapa de lanzamiento
              </p>
              <h2 className="font-heading text-foreground mt-4 text-3xl sm:text-4xl">
                Etapa de lanzamiento.
                <br />
                <span className="text-muted-foreground">
                  Diez propietarios iniciarán primero este sistema profesional.
                </span>
              </h2>
              <p className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-lg">
                Acceder ahora significa valor preferencial y acompañamiento directo. Una vez
                completados los cupos, el valor se actualiza y la disponibilidad pasa a lista de
                espera.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-sm space-y-3">
              {LAUNCH_BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="text-primary h-3 w-3" />
                  </div>
                  <span className="type-body-md text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <p className="type-body-sm text-muted-foreground/60 mt-8 text-center">
              Consulta sin compromiso.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== 12. CTA Final ==================== */}
      <section className="bg-foreground py-20 md:py-28">
        <motion.div
          variants={staggerContainer}
          {...motionProps}
          className="mx-auto max-w-3xl px-4 text-center"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-background text-3xl sm:text-4xl"
          >
            Tu vivienda no necesita más arreglos.
            <br />
            Necesita un sistema.
          </motion.h2>
          <motion.div
            variants={fadeIn}
            className="type-body-lg text-background/60 mx-auto mt-6 max-w-md space-y-1"
          >
            <p>Diagnóstico personalizado.</p>
            <p>Plan preventivo.</p>
            <p>Seguimiento digital.</p>
          </motion.div>
          <motion.p variants={fadeIn} className="type-body-lg text-background/80 mt-4 font-medium">
            Todo empieza con una decisión.
          </motion.p>
          <motion.div variants={fadeIn} className="mt-8">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="gap-2">
                Quiero coordinar mi diagnóstico
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== Footer ==================== */}
      <footer className="border-border border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div>
            <span className="font-heading text-primary text-lg">EPDE</span>
            <p className="type-body-sm text-muted-foreground mt-0.5">
              por Arq. Noelia E. Yuskowich
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="type-body-sm text-muted-foreground">
              Arquitectura aplicada al cuidado del hogar.
            </p>
            <p className="type-body-sm text-muted-foreground/60 mt-1">
              &copy; {new Date().getFullYear()} EPDE. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* ==================== Mobile Sticky CTA ==================== */}
      <div className="border-border bg-background/95 fixed right-0 bottom-0 left-0 z-50 border-t p-2 backdrop-blur-sm md:hidden">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block">
          <Button size="sm" className="w-full gap-2">
            Evaluar mi vivienda
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>
    </div>
  );
}
