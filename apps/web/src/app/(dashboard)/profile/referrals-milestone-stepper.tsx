'use client';

import type { MilestoneState } from '@epde/shared';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMotionPreference } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ReferralsMilestoneStepperProps {
  milestones: MilestoneState[];
  /** Used to render the "te faltan X" copy on the first not-reached step. */
  convertedCount: number;
}

/**
 * Vertical stepper showing the 5 milestones (1 / 2 / 3 / 5 / 10) with
 * a connector line, check icons for the reached ones, and a subtle
 * scale-on-hover even for not-yet-reached milestones (dopamine before
 * the unlock).
 *
 * Respects the user's reduced-motion preference via useMotionPreference
 * — the hover animation is skipped entirely for users who asked for
 * less motion.
 */
export function ReferralsMilestoneStepper({
  milestones,
  convertedCount,
}: ReferralsMilestoneStepperProps) {
  const { shouldAnimate } = useMotionPreference();
  const firstNotReached = milestones.find((m) => !m.reached);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="type-title-md">Tus hitos</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative">
          {milestones.map((m, i) => {
            const isLast = i === milestones.length - 1;
            const remainingForThis =
              !m.reached && firstNotReached?.target === m.target
                ? Math.max(0, m.target - convertedCount)
                : null;
            return (
              <li key={m.target} className="relative pb-5 pl-10 last:pb-0">
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-7 left-3.5 h-full w-px',
                      m.reached ? 'bg-success/40' : 'bg-border',
                    )}
                  />
                )}
                <motion.div
                  whileHover={shouldAnimate ? { scale: 1.06 } : undefined}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className={cn(
                    'absolute top-0 left-0 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                    m.reached
                      ? 'bg-success border-success text-white'
                      : 'border-border bg-background text-muted-foreground',
                  )}
                >
                  {m.reached ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <span className="type-label-sm tabular-nums">{m.target}</span>
                  )}
                </motion.div>

                <div className="flex flex-col gap-0.5">
                  <p className="type-label-lg text-foreground">
                    {m.target} {m.target === 1 ? 'conversión' : 'conversiones'}
                  </p>
                  <p className="type-body-sm text-muted-foreground">{m.reward}</p>
                  {remainingForThis !== null && remainingForThis > 0 && (
                    <p className="type-body-sm text-primary mt-1">
                      Te falta{remainingForThis === 1 ? '' : 'n'} {remainingForThis} conversion
                      {remainingForThis === 1 ? '' : 'es'} más
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
