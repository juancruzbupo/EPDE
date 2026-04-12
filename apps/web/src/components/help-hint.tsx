'use client';

import { HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface HelpHintProps {
  term: string;
  children: ReactNode;
  className?: string;
}

/**
 * Clickeable help icon that opens a popover with a plain-language explanation.
 * Uses Popover (click) instead of Tooltip (hover) because older users don't hover.
 */
export function HelpHint({ term, children, className }: HelpHintProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={className} aria-label={`Ayuda sobre ${term}`}>
          <HelpCircle className="text-muted-foreground hover:text-foreground inline h-4 w-4 shrink-0 transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-sm" side="top">
        <p className="mb-1 font-semibold">{term}</p>
        <div className="text-muted-foreground leading-relaxed">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
