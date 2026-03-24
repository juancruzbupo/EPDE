'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FADE_IN_UP, MOTION_DURATION, useMotionPreference } from '@/lib/motion';

interface HomeStatusCardProps {
  score: number;
  label: string;
  overdueTasks: number;
  upcomingThisWeek: number;
  urgentTasks: number;
  pendingTasks: number;
  completedThisMonth: number;
  pendingBudgets: number;
  onViewActions: () => void;
  onViewAnalytics: () => void;
}

function getScoreTheme(score: number) {
  if (score >= 80)
    return {
      title: 'Tu casa está bien',
      bg: 'bg-success/5',
      border: 'border-success/20',
      barColor: 'var(--success)',
      textColor: 'text-success',
    };
  if (score >= 60)
    return {
      title: 'Tu casa necesita algo de atención',
      bg: 'bg-warning/5',
      border: 'border-warning/20',
      barColor: 'var(--warning)',
      textColor: 'text-warning',
    };
  if (score >= 40)
    return {
      title: 'Tu casa necesita atención',
      bg: 'bg-caution/5',
      border: 'border-caution/20',
      barColor: 'var(--caution)',
      textColor: 'text-caution',
    };
  return {
    title: 'Tu casa necesita atención urgente',
    bg: 'bg-destructive/5',
    border: 'border-destructive/20',
    barColor: 'var(--destructive)',
    textColor: 'text-destructive',
  };
}

function getScoreConsequence(score: number): string | null {
  if (score >= 80) return null;
  if (score >= 60)
    return 'Mantené el ritmo de inspecciones para evitar que los costos de reparación aumenten.';
  if (score >= 40)
    return 'Un ISV por debajo de 60 indica que los problemas se están acumulando. Las reparaciones correctivas suelen costar entre 8x y 15x más que la prevención.';
  return 'Tu vivienda necesita intervención urgente. Cada mes de demora aumenta significativamente el costo de las reparaciones.';
}

function getHumanMessage(overdue: number, urgent: number, upcoming: number): string {
  if (overdue > 0 && urgent > 0)
    return `Tenés ${overdue} tarea${overdue !== 1 ? 's' : ''} vencida${overdue !== 1 ? 's' : ''} y ${urgent} urgente${urgent !== 1 ? 's' : ''}. Revisalas cuanto antes.`;
  if (overdue > 0)
    return `Tenés ${overdue} tarea${overdue !== 1 ? 's' : ''} vencida${overdue !== 1 ? 's' : ''}. Revisalas para mantener tu casa al día.`;
  if (urgent > 0)
    return `Tenés ${urgent} tarea${urgent !== 1 ? 's' : ''} urgente${urgent !== 1 ? 's' : ''}. Completá${urgent !== 1 ? 'las' : 'la'} esta semana.`;
  if (upcoming > 0)
    return `Tenés ${upcoming} tarea${upcoming !== 1 ? 's' : ''} programada${upcoming !== 1 ? 's' : ''} esta semana.`;
  return 'Todo bajo control. Seguí así y tu hogar se va a mantener en excelente estado.';
}

export function HomeStatusCard({
  score,
  label,
  overdueTasks,
  upcomingThisWeek,
  urgentTasks,
  pendingTasks,
  completedThisMonth,
  pendingBudgets,
  onViewActions,
  onViewAnalytics,
}: HomeStatusCardProps) {
  const { shouldAnimate } = useMotionPreference();
  const theme = getScoreTheme(score);
  const message = getHumanMessage(overdueTasks, urgentTasks, upcomingThisWeek);
  const consequence = getScoreConsequence(score);
  const Wrapper = shouldAnimate ? motion.div : 'div';

  const miniStats = [
    {
      label: 'Vencidas',
      hint: 'Tareas que pasaron su fecha de vencimiento',
      value: overdueTasks,
      color: overdueTasks > 0 ? 'text-destructive' : 'text-foreground',
    },
    {
      label: 'Pendientes',
      hint: 'Tareas programadas que aún no vencieron',
      value: pendingTasks,
      color: 'text-foreground',
    },
    {
      label: 'Completadas',
      hint: 'Tareas completadas en los últimos 30 días',
      value: completedThisMonth,
      color: 'text-success',
    },
    {
      label: 'Presupuestos',
      hint: 'Presupuestos esperando tu decisión. Revisalos para avanzar.',
      value: pendingBudgets,
      color: 'text-foreground',
      href: '/budgets',
    },
  ];

  const miniIcons = [AlertTriangle, Clock, CheckCircle, FileText];

  return (
    <Wrapper
      {...(shouldAnimate ? { variants: FADE_IN_UP, initial: 'hidden', animate: 'visible' } : {})}
    >
      <Card className={`${theme.bg} ${theme.border}`}>
        <CardContent className="p-6">
          {/* Title + label */}
          <div className="mb-1 flex items-center justify-between">
            <h2 className="type-title-lg text-foreground">{theme.title}</h2>
            <span className={`type-label-md ${theme.textColor}`}>{label}</span>
          </div>

          {/* Human message */}
          <p className="type-body-md text-muted-foreground mb-1">{message}</p>
          {consequence && <p className="text-muted-foreground mb-4 text-xs">{consequence}</p>}
          {!consequence && <div className="mb-4" />}

          {/* Score + progress bar */}
          <div className="mb-4 flex items-center gap-4">
            <span
              className={`type-number-lg ${theme.textColor}`}
              title="Índice de Salud de la Vivienda — 100 es excelente, 0 es crítico"
            >
              <AnimatedNumber value={score} />
            </span>
            <div className="bg-muted h-3 flex-1 overflow-hidden rounded-full">
              {shouldAnimate ? (
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: theme.barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{
                    duration: MOTION_DURATION.slow * 2,
                    ease: [0.33, 1, 0.68, 1],
                  }}
                />
              ) : (
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: theme.barColor, width: `${score}%` }}
                />
              )}
            </div>
            <span className="type-body-sm text-muted-foreground">/ 100</span>
          </div>

          {/* Action buttons */}
          <div className="mb-5 flex gap-3">
            <Button
              size="sm"
              aria-label="Ver tareas pendientes y acciones recomendadas"
              onClick={onViewActions}
            >
              Ver qué hacer
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-label="Ver análisis completo de salud de tu vivienda"
              onClick={onViewAnalytics}
            >
              Ver análisis completo
            </Button>
          </div>

          {/* Mini stats grid */}
          <div className="border-border grid grid-cols-4 gap-3 border-t pt-4">
            {miniStats.map((stat, i) => {
              const Icon = miniIcons[i]!;
              const content = (
                <div className="text-center">
                  <div className="mb-1 flex justify-center">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <p className={`type-number-md ${stat.color}`}>
                    <AnimatedNumber value={stat.value} />
                  </p>
                  <p className="type-label-sm text-muted-foreground" title={stat.hint}>
                    {stat.label}
                  </p>
                </div>
              );
              return stat.href ? (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="transition-opacity hover:opacity-80"
                >
                  {content}
                </Link>
              ) : (
                <div key={stat.label}>{content}</div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </Wrapper>
  );
}
