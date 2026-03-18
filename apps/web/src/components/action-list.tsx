'use client';

import type { UpcomingTask } from '@epde/shared';
import {
  formatRelativeDate,
  PRIORITY_VARIANT,
  ProfessionalRequirement,
  TASK_PRIORITY_LABELS,
} from '@epde/shared';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STAGGER_CONTAINER, STAGGER_ITEM, useMotionPreference } from '@/lib/motion';

interface ActionListProps {
  tasks: UpcomingTask[];
}

function isTaskOverdue(nextDueDate: string | null): boolean {
  if (!nextDueDate) return false;
  return new Date(nextDueDate) < new Date();
}

function TaskItem({ task }: { task: UpcomingTask }) {
  const overdue = isTaskOverdue(task.nextDueDate);
  const needsPro = task.professionalRequirement !== ProfessionalRequirement.OWNER_CAN_DO;

  return (
    <li>
      <Link
        href={`/tasks?taskId=${task.id}`}
        className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
      >
        <div className="min-w-0 flex-1">
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
                : 'Según detección'}
            </span>
          </div>
        </div>
        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
      </Link>
    </li>
  );
}

export function ActionList({ tasks }: ActionListProps) {
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
                {overdueTasks.map((task) => (
                  <Item key={task.id} {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}>
                    <TaskItem task={task} />
                  </Item>
                ))}
              </ul>
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
