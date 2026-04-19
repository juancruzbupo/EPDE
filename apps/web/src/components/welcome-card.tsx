'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Circle, HelpCircle, Home, ListChecks } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMotionPreference } from '@/lib/motion';
import { ROUTES } from '@/lib/routes';

interface WelcomeCardProps {
  userName: string;
  hasProperties: boolean;
  hasActivePlan: boolean;
  hasCompletedTasks: boolean;
}

export function WelcomeCard({
  userName,
  hasProperties,
  hasActivePlan,
  hasCompletedTasks,
}: WelcomeCardProps) {
  const { shouldAnimate } = useMotionPreference();
  const steps = [
    { label: 'Tu propiedad fue registrada por EPDE', done: hasProperties },
    {
      label: 'El equipo EPDE inspecciona tu casa y crea el plan (1-3 días hábiles)',
      done: hasActivePlan,
    },
    { label: 'Cuando el plan esté activo, completá tu primera tarea', done: hasCompletedTasks },
  ];

  const completedSteps = steps.filter((s) => s.done).length;

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardHeader>
        <CardTitle className="type-title-lg">Bienvenido/a, {userName}</CardTitle>
        <p className="type-body-md text-muted-foreground">
          Estos son los pasos para poner en marcha tu mantenimiento preventivo:
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              {step.done ? (
                shouldAnimate ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    <CheckCircle className="text-success h-5 w-5 shrink-0" />
                  </motion.div>
                ) : (
                  <CheckCircle className="text-success h-5 w-5 shrink-0" />
                )
              ) : (
                <Circle className="text-muted-foreground h-5 w-5 shrink-0" />
              )}
              <span
                className={`text-sm ${step.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <p className="type-body-sm text-muted-foreground">
          {completedSteps} de {steps.length} completados
        </p>

        {/* Jerarquía de CTAs: el primary corresponde al step activo y
         *  ocupa full-width en mobile para que Mariana (38, mobile-first
         *  e impaciente) sepa sin dudar qué tocar. Los secundarios viven
         *  debajo con tipografía más chica, separados visualmente. */}
        <div className="flex flex-col gap-3">
          {hasProperties ? (
            <Button asChild size="default" className="w-full sm:w-auto">
              <Link href={ROUTES.properties}>
                <Home className="mr-2 h-4 w-4" />
                Ver mi propiedad
              </Link>
            </Button>
          ) : (
            <Button asChild size="default" variant="outline" disabled className="w-full sm:w-auto">
              <span>
                <Home className="mr-2 h-4 w-4" />
                Esperando registro de propiedad
              </span>
            </Button>
          )}

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
            {hasActivePlan && (
              <Link
                href={ROUTES.tasks}
                className="hover:text-foreground inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Ver tareas
              </Link>
            )}
            <Link
              href={ROUTES.guide}
              className="hover:text-foreground inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Guía de uso
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
