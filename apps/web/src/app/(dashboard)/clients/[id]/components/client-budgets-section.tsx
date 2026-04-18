import { BUDGET_STATUS_LABELS, BUDGET_STATUS_VARIANT } from '@epde/shared';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgets } from '@/hooks/use-budgets';
import { ROUTES } from '@/lib/routes';

interface ClientBudgetsSectionProps {
  clientId: string;
  clientName: string;
}

export const ClientBudgetsSection = memo(function ClientBudgetsSection({
  clientId,
  clientName,
}: ClientBudgetsSectionProps) {
  const { data, isLoading } = useBudgets({ userId: clientId, take: 5 });
  const budgets = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Presupuestos
          {budgets.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {budgets.length}
            </Badge>
          )}
        </CardTitle>
        <Link
          href={`${ROUTES.budgets}?search=${encodeURIComponent(clientName)}`}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin presupuestos</p>
        ) : (
          <ul className="divide-y">
            {budgets.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <Link href={ROUTES.budget(b.id)} className="text-sm font-medium hover:underline">
                  {b.title}
                </Link>
                <Badge variant={BUDGET_STATUS_VARIANT[b.status] ?? 'secondary'} className="text-xs">
                  {BUDGET_STATUS_LABELS[b.status] ?? b.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
});
