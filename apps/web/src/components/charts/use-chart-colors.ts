'use client';

import { CHART_TOKENS_LIGHT } from '@epde/shared';
import { useEffect, useState } from 'react';

const CHART_VAR_NAMES = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'] as const;

function readChartColors(): string[] {
  if (typeof window === 'undefined') return Object.values(CHART_TOKENS_LIGHT);
  const style = getComputedStyle(document.documentElement);
  return CHART_VAR_NAMES.map((name) => style.getPropertyValue(name).trim() || '#888');
}

export function useChartColors() {
  const [colors, setColors] = useState(readChartColors);

  useEffect(() => {
    setColors(readChartColors());

    const observer = new MutationObserver(() => setColors(readChartColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
