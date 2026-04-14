import { ReactNode } from 'react';

import { HelpHint } from './help-hint';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** If set, renders a help icon next to the title with the given popover body. */
  help?: { term: string; body: ReactNode };
}

export function PageHeader({ title, description, action, help }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h1 className="type-display-sm text-foreground tracking-tight">{title}</h1>
          {help && (
            <HelpHint term={help.term} className="mt-1">
              {help.body}
            </HelpHint>
          )}
        </div>
        {description && (
          <p className="type-body-md text-muted-foreground mt-1 break-words">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
