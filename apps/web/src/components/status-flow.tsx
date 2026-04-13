'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface StatusFlowProps {
  steps: { key: string; label: string; hint?: string }[];
  current: string;
}

export function StatusFlow({ steps, current }: StatusFlowProps) {
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={step.key} className="flex items-center gap-1">
              {i > 0 && (
                <div
                  className={cn(
                    'h-px w-4 shrink-0',
                    isPast || isCurrent ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isPast
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </div>
                </TooltipTrigger>
                {step.hint && <TooltipContent className="max-w-xs">{step.hint}</TooltipContent>}
              </Tooltip>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
