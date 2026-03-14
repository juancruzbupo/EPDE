'use client';

import type { CategoryBreakdownItem } from '@epde/shared';
import { motion } from 'framer-motion';

import { STAGGER_CONTAINER, STAGGER_ITEM, useMotionPreference } from '@/lib/motion';

interface CategoryBreakdownProps {
  data: CategoryBreakdownItem[];
}

const CONDITION_LABELS = ['', 'Crítico', 'Pobre', 'Regular', 'Bueno', 'Excelente'];

function getProgressColor(percent: number) {
  if (percent >= 80) return 'bg-success';
  if (percent >= 50) return 'bg-primary';
  return 'bg-destructive';
}

function ConditionDots({ score }: { score: number }) {
  const rounded = Math.round(score);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-2 w-2 rounded-full ${
            i < rounded ? 'bg-foreground/70' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const { shouldAnimate } = useMotionPreference();
  const Wrapper = shouldAnimate ? motion.div : 'div';
  const Item = shouldAnimate ? motion.div : 'div';

  return (
    <Wrapper
      className="space-y-3"
      {...(shouldAnimate
        ? { variants: STAGGER_CONTAINER, initial: 'hidden', animate: 'visible' }
        : {})}
    >
      {data.map((cat) => {
        const percent =
          cat.totalTasks > 0 ? Math.round((cat.completedTasks / cat.totalTasks) * 100) : 0;
        const condLabel = CONDITION_LABELS[Math.round(cat.avgCondition)] ?? '';

        return (
          <Item
            key={cat.categoryName}
            className="border-border rounded-lg border p-3"
            {...(shouldAnimate ? { variants: STAGGER_ITEM } : {})}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="type-title-sm text-foreground">{cat.categoryName}</span>
              <span className="type-label-sm text-muted-foreground">
                {cat.completedTasks}/{cat.totalTasks} tareas · {percent}%
              </span>
            </div>
            <div className="bg-muted mb-2 h-2 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(percent)}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center gap-3">
              {cat.overdueTasks > 0 && (
                <span className="type-label-sm text-destructive">{cat.overdueTasks} vencidas</span>
              )}
              {cat.avgCondition > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="type-label-sm text-muted-foreground">{condLabel}</span>
                  <ConditionDots score={cat.avgCondition} />
                </div>
              )}
            </div>
          </Item>
        );
      })}
    </Wrapper>
  );
}
