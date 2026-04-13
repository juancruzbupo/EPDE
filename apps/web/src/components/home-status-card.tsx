'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

import { HelpHint } from '@/components/help-hint';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  isvDelta?: number | null;
  streak?: number;
  perfectWeek?: boolean;
  onViewActions: () => void;
  onViewAnalytics: () => void;
  onStreakFreeze?: () => void;
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
  isvDelta,
  streak,
  perfectWeek,
  onViewActions,
  onViewAnalytics,
  onStreakFreeze,
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
      label: 'Completadas este mes',
      hint: 'Tareas completadas en los últimos 30 días',
      value: completedThisMonth,
      color: 'text-success',
    },
    {
      label: 'Presupuestos pendientes',
      hint: 'Presupuestos esperando tu decisión. Revisalos para avanzar.',
      value: pendingBudgets,
      color: 'text-foreground',
      href: '/budgets',
    },
  ];

  const miniIcons = [AlertTriangle, Clock, CheckCircle, FileText];

  return (
    <TooltipProvider>
      <Wrapper
        {...(shouldAnimate ? { variants: FADE_IN_UP, initial: 'hidden', animate: 'visible' } : {})}
      >
        <Card className={`${theme.bg} ${theme.border}`}>
          <CardContent className="p-5 sm:p-7">
            {/* Title + label */}
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="type-display-sm text-foreground tracking-tight">{theme.title}</h2>
                <p className="type-body-md text-muted-foreground mt-0.5">{message}</p>
              </div>
              <span
                className={`type-label-sm ${theme.textColor} mt-1 shrink-0 rounded-full px-2.5 py-0.5 font-medium ${theme.bg}`}
              >
                {label}
              </span>
            </div>

            {/* Consequence — only when score < 80 */}
            {consequence && (
              <p className="type-body-sm text-muted-foreground mb-4">{consequence}</p>
            )}
            {!consequence && <div className="mb-3" />}

            {/* Score + progress bar */}
            <div data-tour="health-score" className="mb-5 flex items-center gap-3 sm:gap-4">
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-[2rem] leading-none font-bold tracking-tight ${theme.textColor}`}
                >
                  <AnimatedNumber value={score} />
                </span>
                <span className="type-body-sm text-muted-foreground">/100</span>
              </div>
              <HelpHint term="Puntaje de Salud (ISV)" className="self-center">
                <p>
                  Mide cuánto cuidado necesita tu casa de 0 a 100. Mantenerlo arriba de 60 evita
                  reparaciones costosas.
                </p>
                <p className="mt-1">
                  Se calcula en base a: tareas al día, estado reportado, cobertura de inspecciones,
                  inversión en prevención y tendencia.
                </p>
              </HelpHint>
              <div
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Índice de Salud de la Vivienda"
                className="bg-muted h-2 flex-1 overflow-hidden rounded-full"
              >
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
            </div>

            {/* Badges — delta, streak, perfect week */}
            {((isvDelta !== null && isvDelta !== undefined && isvDelta !== 0) ||
              (streak && streak > 0) ||
              perfectWeek) && (
              <div
                data-tour="streak-badges"
                className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2"
              >
                {isvDelta !== null && isvDelta !== undefined && isvDelta !== 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`type-label-sm inline-flex cursor-default items-center gap-1 rounded-full px-2.5 py-1 font-medium ${
                          isvDelta > 0
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {isvDelta > 0 ? '↑' : '↓'} {Math.abs(isvDelta)} puntos este mes
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Cambio en el puntaje respecto al mes anterior</TooltipContent>
                  </Tooltip>
                )}

                {streak !== undefined && streak > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="bg-primary/10 text-primary type-label-sm inline-flex cursor-default items-center gap-1 rounded-full px-2.5 py-1 font-medium">
                        🔥 {streak} {streak === 1 ? 'mes' : 'meses'} al día
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Meses seguidos en los que completaste todas las tareas a tiempo
                    </TooltipContent>
                  </Tooltip>
                )}

                {perfectWeek && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="bg-success/10 text-success type-label-sm inline-flex cursor-default items-center gap-1 rounded-full px-2.5 py-1 font-medium">
                        ✓ Semana perfecta
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Esta semana completaste todas las tareas programadas. ¡Seguí así!
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Streak actions — text links, visually secondary */}
                {streak !== undefined && streak > 0 && (
                  <span className="type-label-sm text-muted-foreground hidden items-center gap-2 sm:inline-flex">
                    <button
                      type="button"
                      className="hover:text-primary inline-flex items-center gap-1 transition-colors"
                      aria-label="Compartir racha por WhatsApp"
                      onClick={() => {
                        const msg = encodeURIComponent(
                          `🔥 Llevo ${streak} ${streak === 1 ? 'mes' : 'meses'} al día con el mantenimiento de mi casa usando EPDE. epde.com.ar`,
                        );
                        window.open(`https://wa.me/?text=${msg}`, '_blank');
                      }}
                    >
                      <Share2 className="h-3 w-3" />
                      Compartir
                    </button>
                    {onStreakFreeze && (
                      <>
                        <span className="text-border">·</span>
                        <button
                          type="button"
                          className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                          aria-label="Proteger racha este mes"
                          onClick={onStreakFreeze}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Proteger
                        </button>
                        <HelpHint term="Proteger racha" className="ml-0">
                          Si este mes no podés completar las tareas (vacaciones, mudanza, etc.),
                          activá la protección para que tu racha no se rompa. Se puede usar 1 vez
                          por mes.
                        </HelpHint>
                      </>
                    )}
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div data-tour="action-buttons" className="mb-6 flex flex-wrap gap-3">
              <Button
                aria-label="Ver tareas pendientes y acciones recomendadas"
                onClick={onViewActions}
              >
                Ver qué hacer
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                aria-label="Ver análisis completo de salud de tu vivienda"
                onClick={onViewAnalytics}
              >
                Ver análisis completo
              </Button>
            </div>

            {/* Mini stats grid */}
            <div
              data-tour="mini-stats"
              className="border-border sm:divide-border grid grid-cols-2 gap-y-4 border-t pt-5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x"
            >
              {miniStats.map((stat, i) => {
                const Icon = miniIcons[i]!;
                const content = (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-default px-3 text-center">
                        <div className="bg-muted/60 mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full">
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                        <p className={`text-xl font-semibold tracking-tight ${stat.color}`}>
                          <AnimatedNumber value={stat.value} />
                        </p>
                        <p className="type-label-sm text-muted-foreground mt-0.5">{stat.label}</p>
                        <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight sm:hidden">
                          {stat.hint}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{stat.hint}</TooltipContent>
                  </Tooltip>
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
    </TooltipProvider>
  );
}
