'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Search, ClipboardList, MonitorSmartphone, Minus } from 'lucide-react';
import { fadeIn, fadeInUp, staggerContainer, staggerItem, useMotionPreference } from '@/lib/motion';

const WHATSAPP_URL =
  'https://wa.me/5493001234567?text=Hola%2C%20quiero%20agendar%20un%20diagn%C3%B3stico%20EPDE';

const problemCards = [
  {
    title: 'Desgaste silencioso',
    text: 'Los problemas más caros son los que no se ven. Una fisura que crece, humedad que avanza, instalaciones que envejecen sin revisión.',
  },
  {
    title: 'Improvisación constante',
    text: 'Llamar a alguien cuando algo se rompe no es mantenimiento. Es reacción. Y siempre sale más caro.',
  },
  {
    title: 'Sin historial ni sistema',
    text: 'Presupuestos perdidos, arreglos sin documentar, intervenciones que se repiten porque nadie lleva registro.',
  },
];

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Diagnóstico profesional',
    text: 'Visitamos tu vivienda y realizamos una evaluación técnica integral. Relevamos estructura, instalaciones, envolvente y estado general con criterio arquitectónico.',
  },
  {
    number: '02',
    icon: ClipboardList,
    title: 'Plan preventivo personalizado',
    text: 'Diseñamos un plan de mantenimiento a medida de tu propiedad: tareas priorizadas por urgencia, frecuencias calibradas y recomendaciones técnicas específicas.',
  },
  {
    number: '03',
    icon: MonitorSmartphone,
    title: 'Seguimiento con sistema digital',
    text: 'Tu plan se carga en nuestra plataforma. Seguí las tareas, recibí recordatorios, solicitá presupuestos y mantené un historial completo de tu vivienda.',
  },
];

const comparisons = [
  {
    bad: 'Visitas improvisadas sin método',
    good: 'Evaluación sistemática con criterio técnico',
  },
  {
    bad: 'Checklists genéricos para cualquier casa',
    good: 'Plan personalizado según tu vivienda',
  },
  {
    bad: 'Reaccionar cuando algo se rompe',
    good: 'Prevenir antes de que el problema escale',
  },
  {
    bad: 'Papeles sueltos y presupuestos perdidos',
    good: 'Todo organizado en un solo sistema digital',
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
    <div className="flex min-h-screen flex-col">
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
            Estudio Profesional de Diagnóstico Edilicio
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            className="font-heading text-foreground mt-6 text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            La nueva forma profesional
            <br />
            <span className="text-primary">de cuidar tu casa.</span>
          </motion.h1>
          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-6 max-w-2xl"
          >
            Diagnóstico arquitectónico personalizado + plan de mantenimiento preventivo con
            seguimiento en sistema digital.
          </motion.p>
          <motion.div variants={fadeIn} className="mt-8">
            <Link href="#agendar">
              <Button size="lg" className="gap-2">
                Agendá tu diagnóstico
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="type-body-sm text-muted-foreground mt-3">
              Primeros 10 cupos con valor de lanzamiento
            </p>
          </motion.div>
          <div className="bg-border mx-auto mt-12 h-px max-w-xs" />
        </motion.div>
      </section>

      {/* Problema */}
      <section className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-4xl px-4">
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
            Tu casa no necesita solo arreglos.
            <br />
            <span className="text-muted-foreground">Necesita planificación profesional.</span>
          </motion.h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {problemCards.map((card) => (
              <motion.div
                key={card.title}
                variants={staggerItem}
                className="bg-muted/40 rounded-lg p-5 sm:p-6"
              >
                <h3 className="type-title-sm text-foreground">{card.title}</h3>
                <p className="type-body-md text-muted-foreground mt-2">{card.text}</p>
              </motion.div>
            ))}
          </div>
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
            Arquitectura aplicada al cuidado del hogar.
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
        </motion.div>
      </section>

      {/* Diferencial */}
      <section className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-4xl px-4">
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Por qué EPDE
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            No es mantenimiento común.
            <br />
            <span className="text-muted-foreground">Es criterio profesional.</span>
          </motion.h2>
          <div className="mt-10 space-y-4">
            {comparisons.map((row) => (
              <motion.div
                key={row.bad}
                variants={staggerItem}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div className="border-border/60 bg-background flex items-start gap-3 rounded-lg border p-4 sm:p-5">
                  <Minus className="text-muted-foreground/50 mt-0.5 h-4 w-4 shrink-0" />
                  <span className="type-body-md text-muted-foreground">{row.bad}</span>
                </div>
                <div className="border-primary/20 bg-primary/[0.03] flex items-start gap-3 rounded-lg border p-4 sm:p-5">
                  <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <span className="type-body-md text-foreground font-medium">{row.good}</span>
                </div>
              </motion.div>
            ))}
          </div>
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
          </motion.div>
        </motion.div>
      </section>

      {/* Lanzamiento */}
      <section id="agendar" className="py-20 md:py-28">
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
              Estamos abriendo las primeras evaluaciones con un valor especial de lanzamiento. Cupos
              limitados para garantizar la calidad del servicio.
            </p>
            <div className="mt-8">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2">
                  Agendá tu diagnóstico
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <p className="type-body-sm text-muted-foreground mt-3">
                Sin compromiso. Consultá y te explicamos cómo funciona.
              </p>
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
            Implementá un sistema profesional para tu vivienda.
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
                Agendá tu diagnóstico
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
    </div>
  );
}
