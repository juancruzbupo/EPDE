'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef } from 'react';

/**
 * Reads filter values from URL search params and provides a setter that
 * syncs changes back to the URL via `router.replace` (no scroll).
 *
 * Usage:
 *   const [params, setParams] = useUrlFilters();
 *   const search = params.get('search') ?? '';
 *   setParams({ search: 'foo', status: 'all' }); // 'all' or '' are removed from URL
 */
export function useUrlFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Stable ref to avoid stale closures in effects
  const paramsRef = useRef(searchParams);
  paramsRef.current = searchParams;

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(paramsRef.current);
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  return [searchParams, setParams] as const;
}
