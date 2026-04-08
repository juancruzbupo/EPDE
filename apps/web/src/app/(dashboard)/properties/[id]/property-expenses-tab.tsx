'use client';

import { PROPERTY_SECTOR_LABELS, type PropertySector } from '@epde/shared';
import { ChevronDown, ChevronRight, ClipboardList, DollarSign, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { ExpensesTour } from '@/components/onboarding-tour';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePropertyExpenses } from '@/hooks/use-properties';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);

export function PropertyExpensesTab({ propertyId }: { propertyId: string }) {
  const { data: expenses, isLoading, isError, refetch } = usePropertyExpenses(propertyId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<'category' | 'sector'>('sector');

  const analytics = useMemo(() => {
    if (!expenses || expenses.items.length === 0) return null;

    const items = expenses.items;
    const dates = items.map((i) => new Date(i.date).getTime());
    const oldest = new Date(Math.min(...dates));
    const months = Math.max(
      1,
      Math.ceil((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    );
    const monthlyAvg = expenses.totalCost / months;

    // Group by category
    const byCategory = new Map<string, { total: number; count: number }>();
    for (const item of items) {
      const cat = item.category ?? 'Presupuestos';
      const entry = byCategory.get(cat) ?? { total: 0, count: 0 };
      entry.total += item.amount;
      entry.count += 1;
      byCategory.set(cat, entry);
    }
    const categories = [...byCategory.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    const topCategory = categories[0];
    const maxCategoryTotal = topCategory?.total ?? 0;

    // Sector grouping
    const bySector = new Map<string, { total: number; count: number }>();
    for (const item of items) {
      const sec = item.sector ?? 'Sin sector';
      const entry = bySector.get(sec) ?? { total: 0, count: 0 };
      entry.total += item.amount;
      entry.count += 1;
      bySector.set(sec, entry);
    }
    const sectors = [...bySector.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
    const maxSectorTotal = sectors[0]?.total ?? 0;

    // Task vs Budget split
    const taskTotal = items.filter((i) => i.type === 'task').reduce((s, i) => s + i.amount, 0);
    const budgetTotal = items.filter((i) => i.type === 'budget').reduce((s, i) => s + i.amount, 0);

    return {
      months,
      monthlyAvg,
      categories,
      topCategory,
      maxCategoryTotal,
      sectors,
      maxSectorTotal,
      taskTotal,
      budgetTotal,
    };
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="bg-muted/40 h-16 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted/40 h-8 animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message="No se pudieron cargar los gastos" onRetry={refetch} className="py-12" />
    );
  }

  if (!expenses || expenses.items.length === 0 || !analytics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <DollarSign className="text-muted-foreground/60 h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            No hay gastos registrados para esta propiedad.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ExpensesTour />
      {/* Row 1 — Stat Cards */}
      <div data-tour="expenses-stats" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2.5">
                <DollarSign className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total acumulado</p>
                <p className="type-number-md text-foreground">
                  {formatCurrency(expenses.totalCost)}
                </p>
                <p className="text-muted-foreground text-xs">
                  en {analytics.months} mes{analytics.months !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2.5">
                <TrendingUp className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Costo mensual promedio</p>
                <p className="type-number-md text-foreground">
                  {formatCurrency(analytics.monthlyAvg)}
                </p>
                <p className="text-muted-foreground text-xs">/mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2.5">
                <ClipboardList className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Categoría principal</p>
                <p className="type-title-sm text-foreground truncate">
                  {analytics.topCategory?.name ?? '—'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {analytics.topCategory
                    ? `${formatCurrency(analytics.topCategory.total)} (${analytics.topCategory.count} items)`
                    : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preventive savings insight */}
      {analytics && analytics.taskTotal > 0 && (
        <div className="bg-success/5 border-success/20 rounded-lg border p-3">
          <p className="type-body-sm text-success font-medium">
            El mantenimiento preventivo reduce hasta un 80% el costo de reparaciones mayores. Tu
            inversión en tareas preventivas contribuye a preservar el valor de tu vivienda.
          </p>
        </div>
      )}

      {/* Row 2 — Breakdown with toggle */}
      <Card data-tour="expenses-breakdown">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="type-title-md">
              Gasto por {groupBy === 'sector' ? 'sector' : 'categoría'}
            </CardTitle>
            <p className="type-body-sm text-muted-foreground">
              Tareas: {formatCurrency(analytics.taskTotal)} · Presupuestos:{' '}
              {formatCurrency(analytics.budgetTotal)}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setGroupBy('sector')}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                groupBy === 'sector'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Sector
            </button>
            <button
              onClick={() => setGroupBy('category')}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                groupBy === 'category'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Categoría
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(groupBy === 'sector' ? analytics.sectors : analytics.categories).map((item) => {
              const maxTotal =
                groupBy === 'sector' ? analytics.maxSectorTotal : analytics.maxCategoryTotal;
              const pct = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
              const label =
                groupBy === 'sector'
                  ? (PROPERTY_SECTOR_LABELS[item.name as PropertySector] ?? item.name)
                  : item.name;
              return (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {item.count} item{item.count !== 1 ? 's' : ''} ·{' '}
                    {Math.round((item.total / expenses.totalCost) * 100)}% del total
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Row 3 — Collapsible History */}
      <Card>
        <button
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex w-full items-center justify-between p-6 text-left"
        >
          <div>
            <p className="type-title-md">Historial detallado</p>
            <p className="type-body-sm text-muted-foreground">
              {expenses.items.length} movimiento{expenses.items.length !== 1 ? 's' : ''}
            </p>
          </div>
          {historyOpen ? (
            <ChevronDown className="text-muted-foreground h-5 w-5" />
          ) : (
            <ChevronRight className="text-muted-foreground h-5 w-5" />
          )}
        </button>
        {historyOpen && (
          <CardContent className="border-t pt-4">
            <div className="divide-y">
              {expenses.items.map((item) => (
                <div
                  key={`${item.date}-${item.description}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.category ?? 'Presupuesto'} ·{' '}
                      {new Date(item.date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.type === 'task' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {item.type === 'task' ? 'Tarea' : 'Presupuesto'}
                    </Badge>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
