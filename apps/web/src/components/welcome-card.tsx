'use client';

import { CheckCircle, Circle, HelpCircle, Home, ListChecks } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const steps = [
    { label: 'Tu propiedad fue registrada por EPDE', done: hasProperties },
    {
      label: 'La arquitecta inspecciona tu casa y crea el plan (puede tardar unos días)',
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
                <CheckCircle className="text-success h-5 w-5 shrink-0" />
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

        <div className="flex flex-wrap gap-2">
          {hasProperties ? (
            <Button asChild size="sm">
              <Link href="/properties">
                <Home className="mr-2 h-4 w-4" />
                Ver mi propiedad
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" disabled>
              <span>
                <Home className="mr-2 h-4 w-4" />
                Esperando registro de propiedad
              </span>
            </Button>
          )}
          {hasActivePlan && (
            <Button asChild size="sm" variant="outline">
              <Link href="/tasks">
                <ListChecks className="mr-2 h-4 w-4" />
                Ver tareas
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href="/guide">
              <HelpCircle className="mr-2 h-4 w-4" />
              Guía de uso
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
