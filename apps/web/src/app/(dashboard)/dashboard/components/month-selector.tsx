import React from 'react';

interface MonthSelectorProps {
  chartMonths: number;
  onChange: (m: number) => void;
}

export const MonthSelector = React.memo(function MonthSelector({
  chartMonths,
  onChange,
}: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="type-body-sm text-muted-foreground">Periodo:</span>
      {([3, 6, 12] as const).map((m) => (
        <button
          key={m}
          aria-label={`Mostrar últimos ${m} meses`}
          onClick={() => onChange(m)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            chartMonths === m
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:bg-muted/40'
          }`}
        >
          {m} meses
        </button>
      ))}
    </div>
  );
});
