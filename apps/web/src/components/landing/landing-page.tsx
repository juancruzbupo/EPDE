'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Search, ClipboardList, MonitorSmartphone, X, User } from 'lucide-react';
import { fadeIn, fadeInUp, staggerContainer, staggerItem, useMotionPreference } from '@/lib/motion';
import { cn } from '@/lib/utils';

const WHATSAPP_URL =
  'https://wa.me/5493001234567?text=Hola%20Noelia%2C%20quiero%20informaci%C3%B3n%20sobre%20el%20diagn%C3%B3stico%20profesional%20personalizado%20para%20mi%20vivienda.';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Diagnóstico profesional',
    text: 'Visitamos tu vivienda y evaluamos estructura, instalaciones y estado general.',
  },
  {
    number: '02',
    icon: ClipboardList,
    title: 'Plan preventivo personalizado',
    text: 'Diseñamos un plan a medida: tareas priorizadas, frecuencias y recomendaciones técnicas.',
  },
  {
    number: '03',
    icon: MonitorSmartphone,
    title: 'Seguimiento preventivo con sistema digital',
    text: 'Tu plan se carga en la plataforma. Seguí las tareas, recibí recordatorios y mantené el historial.',
  },
];

const diagnosticItems = [
  'Evaluación técnica integral de la vivienda',
  'Identificación de puntos críticos y prioridades',
  'Plan de mantenimiento preventivo personalizado',
  'Carga completa en el sistema digital EPDE',
  'Historial estructurado desde el día uno',
  'Acceso a la plataforma web y app mobile',
];

const forWhom = [
  { text: 'Propietarios de viviendas unifamiliares', included: true },
  { text: 'Personas que buscan orden y previsión en el mantenimiento', included: true },
  { text: 'Quienes quieren proteger el valor de su propiedad a largo plazo', included: true },
  { text: 'No es un servicio de urgencias ni reparaciones improvisadas', included: false },
];

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
      {/* Header */}
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

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-28">
        <motion.div
          variants={staggerContainer}
          {...motionProps}
          className="mx-auto max-w-4xl px-4 text-center"
        >
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Diagnóstico arquitectónico · Mantenimiento preventivo
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="font-heading text-foreground mt-6 text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Tu vivienda,
            <br />
            <span className="text-primary">bajo control profesional.</span>
          </motion.h1>
          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-6 max-w-2xl"
          >
            Diagnóstico arquitectónico y plan preventivo con seguimiento digital.
            <br />
            Orden, criterio y previsión para cuidar lo que construiste.
          </motion.p>
          <motion.p variants={fadeIn} className="type-body-sm text-muted-foreground/70 mt-3 italic">
            Servicio profesional a cargo de{' '}
            <span className="text-foreground/80 font-medium">Noelia E. Yuskowich</span>, arquitecta.
          </motion.p>
          <motion.div variants={fadeIn} className="bg-border mx-auto mt-6 h-px w-16" />
          <motion.div
            variants={fadeIn}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                Agendar diagnóstico
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link href="#agendar">
              <Button size="lg" variant="ghost" className="text-muted-foreground gap-2">
                Más información
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
          <motion.p variants={fadeIn} className="type-body-sm text-muted-foreground mt-3">
            Primeros 10 cupos con valor de lanzamiento
          </motion.p>
        </motion.div>
      </section>

      {/* Problema */}
      <section className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            El problema
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Sin planificación, el mantenimiento
            <br />
            <span className="text-muted-foreground">se vuelve improvisación.</span>
          </motion.h2>
          <motion.p variants={fadeIn} className="type-body-lg text-muted-foreground mt-6">
            Las filtraciones que avanzan sin control, las instalaciones que envejecen sin revisión,
            los arreglos que se repiten porque nadie lleva un registro. Cuando el mantenimiento no
            tiene sistema, cada intervención es una urgencia.
          </motion.p>
          <motion.p variants={fadeIn} className="type-body-md text-muted-foreground/70 mt-4">
            Cuando no hay sistema, el mantenimiento se vuelve reacción.
            <br />Y vivir reaccionando desgasta.
          </motion.p>
        </motion.div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-muted/30 py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-5xl px-4">
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
            Tres pasos para un sistema profesional
            <br />
            <span className="text-muted-foreground">de mantenimiento.</span>
          </motion.h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <motion.div key={step.number} variants={staggerItem}>
                <span className="font-heading text-primary/20 text-4xl">{step.number}</span>
                <div className="mt-2 flex items-center gap-2">
                  <step.icon className="text-primary h-5 w-5" strokeWidth={1.5} />
                  <h3 className="type-title-sm text-foreground">{step.title}</h3>
                </div>
                <p className="type-body-md text-muted-foreground mt-2">{step.text}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            variants={fadeIn}
            className="type-body-md text-muted-foreground/70 mt-10 text-center"
          >
            Dejá de depender de la memoria o la urgencia.
            <br />
            Tu vivienda pasa a tener planificación.
          </motion.p>
        </motion.div>
      </section>

      {/* Quién está detrás */}
      <section className="py-20 md:py-28">
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
            Una arquitecta con método,
            <br />
            <span className="text-muted-foreground">no un servicio genérico.</span>
          </motion.h2>
          <motion.div variants={fadeIn} className="mt-10 flex items-start gap-5">
            <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
              <User className="text-primary h-6 w-6" />
            </div>
            <div className="space-y-4">
              <p className="type-body-lg text-foreground">
                Soy Noelia Yuskowich, arquitecta. Después de años diagnosticando patologías
                edilicias, creé EPDE para ofrecer algo que no existía en el mercado: un sistema
                profesional de mantenimiento preventivo para viviendas unifamiliares.
              </p>
              <p className="type-body-md text-muted-foreground">
                Cada diagnóstico lo realizo personalmente. No es un checklist genérico — es una
                evaluación con criterio arquitectónico, adaptada a tu vivienda.
              </p>
              <p className="type-body-md text-foreground/80 italic">
                Creo que una vivienda no solo se construye: se cuida.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Qué incluye */}
      <section className="bg-muted/30 py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Tu diagnóstico incluye
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Todo lo que necesitás para empezar
            <br />
            <span className="text-muted-foreground">con el pie derecho.</span>
          </motion.h2>
          <motion.div
            variants={fadeIn}
            className="border-border bg-card mt-10 rounded-xl border p-6 sm:p-8"
          >
            <ul className="space-y-4">
              {diagnosticItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="bg-primary/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="text-primary h-3 w-3" />
                  </div>
                  <span className="type-body-lg text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <div className="bg-border my-6 h-px" />
            <p className="type-body-md text-muted-foreground">
              El diagnóstico es el primer paso. A partir de ahí, tu vivienda tiene sistema.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 type-body-md mt-4 inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Coordinar diagnóstico
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Después del diagnóstico */}
      <section className="bg-muted/15 py-20 md:py-28">
        <motion.div
          variants={staggerContainer}
          {...motionProps}
          className="mx-auto max-w-3xl px-4 text-center"
        >
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Después del diagnóstico
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Tu vivienda tiene un plan.
            <br />
            <span className="text-muted-foreground">Vos decidís cómo avanzar.</span>
          </motion.h2>
          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-6 max-w-xl"
          >
            Después de la evaluación, tu vivienda tiene un plan. Podés seguirlo por tu cuenta o
            solicitar presupuestos desde la plataforma cuando lo necesites. Sin obligación. Sin
            improvisación.
          </motion.p>
        </motion.div>
      </section>

      {/* Para quién es */}
      <section className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Para quién es
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Un servicio pensado para propietarios
            <br />
            <span className="text-muted-foreground">que valoran la previsión.</span>
          </motion.h2>
          <motion.div variants={fadeIn} className="mt-10 space-y-4">
            {forWhom.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                {item.included ? (
                  <div className="bg-primary/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="text-primary h-3 w-3" />
                  </div>
                ) : (
                  <div className="bg-muted mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                    <X className="text-muted-foreground h-3 w-3" />
                  </div>
                )}
                <span
                  className={cn(
                    'type-body-lg',
                    item.included ? 'text-foreground' : 'text-muted-foreground line-through',
                  )}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Lanzamiento */}
      <section id="agendar" className="bg-muted/30 py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.div
            variants={fadeInUp}
            className="border-primary/20 bg-primary/[0.02] rounded-xl border-2 p-8 text-center sm:p-12"
          >
            <p className="type-label-md text-primary tracking-widest uppercase">Lanzamiento</p>
            <h2 className="font-heading text-foreground mt-4 text-3xl sm:text-4xl">
              Primeros 10 cupos
            </h2>
            <p className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-lg">
              Disponibilidad limitada en etapa de lanzamiento. Una vez completados los cupos, el
              valor del diagnóstico se actualiza.
            </p>
            <div className="mt-8">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2">
                  Reservar diagnóstico
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Final */}
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
            Cuidar tu vivienda también es
            <br />
            cuidar tu tranquilidad.
          </motion.h2>
          <motion.p
            variants={fadeIn}
            className="type-body-lg text-background/60 mx-auto mt-4 max-w-lg"
          >
            Diagnóstico personalizado. Plan preventivo. Seguimiento digital. Todo empieza con una
            evaluación.
          </motion.p>
          <motion.div variants={fadeIn} className="mt-8">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="gap-2">
                Coordinar evaluación inicial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
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

      {/* Mobile Sticky CTA */}
      <div className="border-border bg-background/95 fixed right-0 bottom-0 left-0 z-50 border-t p-3 backdrop-blur-sm md:hidden">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full gap-2">
            Agendar diagnóstico
            <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  );
}
