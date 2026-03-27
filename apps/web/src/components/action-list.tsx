'use client';

import type { UpcomingTask } from '@epde/shared';
import {
  formatRelativeDate,
  PRIORITY_VARIANT,
  ProfessionalRequirement,
  RECURRENCE_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
} from '@epde/shared';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, ChevronRight, ClipboardCheck, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STAGGER_CONTAINER, STAGGER_ITEM, useMotionPreference } from '@/lib/motion';

interface ActionListProps {
  tasks: UpcomingTask[];
  /** First UPCOMING task (not overdue) to highlight as "next inspection" */
  nextUpcoming?: UpcomingTask | null;
}

function isTaskOverdue(nextDueDate: string | null): boolean {
  if (!nextDueDate) return false;
  return new Date(nextDueDate) < new Date();
}

function TaskItem({ task, showRegister }: { task: UpcomingTask; showRegister?: boolean }) {
  const overdue = isTaskOverdue(task.nextDueDate);
  const needsPro = task.professionalRequirement !== ProfessionalRequirement.OWNER_CAN_DO;

  return (
    <li>
      <div className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors">
        <Link href={`/tasks?taskId=${task.id}`} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-title-sm text-foreground truncate" title={task.name}>
              {task.name}
            </span>
            <Badge variant="outline" className="shrink-0 text-xs">
              {task.categoryName}
            </Badge>
            <Badge
              variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}
              className="shrink-0 text-xs"
            >
              {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
            </Badge>
            {needsPro && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                <Wrench className="mr-1 h-3 w-3" />
                Requiere profesional
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
            <span className="truncate" title={task.propertyAddress}>
              {task.propertyAddress}
            </span>
            {task.sector && (
              <>
                <span>·</span>
                <span>{task.sector}</span>
              </>
            )}
            <span>·</span>
            <span className={overdue ? 'text-destructive font-medium' : ''}>
              {task.nextDueDate
                ? overdue
                  ? `Vencida ${formatRelativeDate(new Date(task.nextDueDate))}`
                  : formatRelativeDate(new Date(task.nextDueDate))
                : RECURRENCE_TYPE_LABELS.ON_DETECTION}
            </span>
          </div>
        </Link>
        {showRegister ? (
          <Link href={`/tasks?taskId=${task.id}&action=complete`}>
            <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Registrar
            </Button>
          </Link>
        ) : (
          <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
        )}
      </div>
    </li>
  );
}

/** Highlighted card for the next upcoming inspection — shown above ActionList sections. */
function NextInspectionCard({ task }: { task: UpcomingTask }) {
  return (
    <Card className="border-primary/20 bg-primary/5 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <Calendar className="text-primary h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="type-body-sm text-muted-foreground">Próxima inspección</p>
            <Link
              href={`/tasks?taskId=${task.id}`}
              className="type-title-sm text-foreground hover:underline"
            >
              {task.name}
            </Link>
            <p className="type-body-sm text-muted-foreground mt-0.5">
              {task.propertyAddress}
              {task.nextDueDate && ` · ${formatRelativeDate(new Date(task.nextDueDate))}`}
            </p>
          </div>
          <Link href={`/tasks?taskId=${task.id}&action=complete`}>
            <Button size="sm" className="shrink-0 gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Registrar
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActionList({ tasks, nextUpcoming }: ActionListProps) {
  const { shouldAnimate } = useMotionPreference();
  const Wrapper = shouldAnimate ? motion.div : 'div';
  const Item = shouldAnimate ? motion.div : 'div';

  const { overdueTasks, upcomingTasks } = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return {
      overdueTasks: tasks.filter((t) => t.nextDueDate && new Date(t.nextDueDate) < now),
      upcomingTasks: tasks.filter(
        (t) =>
          t.nextDueDate && new Date(t.nextDueDate) >= now && new Date(t.nextDueDate) <= weekFromNow,
      ),
    };
  }, [tasks]);

  if (overdueTasks.length === 0 && upcomingTasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="text-success h-8 w-8" />
            <p className="type-title-sm text-foreground">Todo al día</p>
            <p className="type-body-sm text-muted-foreground">
              No tenés tareas vencidas ni programadas esta semana.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Next upcoming inspection — prominent card */}
      {nextUpcoming && <NextInspectionCard task={nextUpcoming} />}

      {/* Overdue section */}
      {overdueTasks.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="type-title-md text-destructive">Necesitan atención</CardTitle>
          </CardHeader>
          <CardContent>
            <Wrapper
              {...(shouldAnimate
                ? { variants: STAGGER_CONTAINER, initial: 'hidden', animate: 'visible' }
                : {})}
            >
              <ul className="space-y-2">
                {overdueTasks.slice(0, 5).map((task) => (
                  <Item key={task.id} {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
                    <TaskItem task={task} showRegister />
                  </Item>
                ))}
              </ul>
              {overdueTasks.length > 5 && (
                <Link
                  href="/tasks"
                  className="text-destructive hover:text-destructive/80 mt-3 block text-center text-sm font-medium"
                >
                  Ver las {overdueTasks.length} tareas vencidas →
                </Link>
              )}
            </Wrapper>
          </CardContent>
        </Card>
      )}

      {/* This week section */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="type-title-md">Tu semana</CardTitle>
          </CardHeader>
          <CardContent>
            <Wrapper
              {...(shouldAnimate
                ? { variants: STAGGER_CONTAINER, initial: 'hidden', animate: 'visible' }
                : {})}
            >
              <ul className="space-y-2">
                {upcomingTasks.map((task) => (
                  <Item key={task.id} {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
                    <TaskItem task={task} />
                  </Item>
                ))}
              </ul>
            </Wrapper>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
