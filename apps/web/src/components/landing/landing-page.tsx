'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardCheck,
  CalendarClock,
  ShieldCheck,
  FileText,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Planes de Mantenimiento',
    description:
      'Planes personalizados para cada propiedad con tareas organizadas por categoría y prioridad.',
  },
  {
    icon: CalendarClock,
    title: 'Recordatorios Automáticos',
    description:
      'Recibí notificaciones antes de cada vencimiento para que nunca te olvides de una tarea.',
  },
  {
    icon: FileText,
    title: 'Presupuestos',
    description:
      'Solicitá y gestioná presupuestos con seguimiento de estado completo desde la plataforma.',
  },
  {
    icon: ShieldCheck,
    title: 'Solicitudes de Servicio',
    description: 'Reportá problemas con fotos y hacé seguimiento hasta su resolución.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Registrate',
    description: 'Recibís tu invitación y configurás tu cuenta en minutos.',
  },
  {
    number: '2',
    title: 'Organizá tu propiedad',
    description: 'Cargamos tu vivienda y armamos un plan de mantenimiento a medida.',
  },
  {
    number: '3',
    title: 'Mantené el control',
    description: 'Seguí las tareas, solicitá presupuestos y reportá problemas desde un solo lugar.',
  },
];

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuthStore();

  const ctaHref = isLoading ? '/login' : isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? 'Ir al Dashboard' : 'Iniciar Sesión';

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-primary font-serif text-2xl font-bold tracking-tight">EPDE</span>
          <Link href={ctaHref}>
            <Button variant="outline" size="sm">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-secondary/20 py-20 md:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-foreground font-serif text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Mantenimiento preventivo
            <br />
            <span className="text-primary">para tu vivienda</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
            Organizá el cuidado de tu hogar con planes personalizados, recordatorios automáticos y
            seguimiento profesional. Todo en una sola plataforma.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href={ctaHref}>
              <Button size="lg" className="gap-2">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-foreground text-center font-serif text-3xl font-bold">
            Todo lo que necesitás
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-center">
            Herramientas diseñadas para simplificar el mantenimiento de tu propiedad.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-none shadow-sm">
                <CardContent className="pt-6">
                  <feature.icon className="text-primary h-10 w-10" />
                  <h3 className="text-foreground mt-4 font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/20 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-foreground text-center font-serif text-3xl font-bold">
            Cómo funciona
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="bg-primary mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white">
                  {step.number}
                </div>
                <h3 className="text-foreground mt-4 font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-foreground font-serif text-3xl font-bold">
            Empezá a cuidar tu hogar hoy
          </h2>
          <div className="mt-4 space-y-2">
            {[
              'Planes de mantenimiento a medida',
              'Seguimiento completo de tareas y presupuestos',
              'Soporte profesional dedicado',
            ].map((item) => (
              <div
                key={item}
                className="text-muted-foreground flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="text-primary h-4 w-4" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
          <Link href={ctaHref} className="mt-8 inline-block">
            <Button size="lg" className="gap-2">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <span className="text-primary font-serif text-lg font-bold">EPDE</span>
          <p className="text-muted-foreground mt-2 text-sm">
            Estudio Profesional de Diagnóstico Edilicio
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            &copy; {new Date().getFullYear()} EPDE. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
