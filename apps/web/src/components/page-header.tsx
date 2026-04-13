import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="type-display-sm text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="type-body-md text-muted-foreground mt-1 break-words">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
