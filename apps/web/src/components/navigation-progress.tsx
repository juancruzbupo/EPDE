'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Top-level navigation progress bar — provides instant visual feedback
 * when navigating between pages in Next.js App Router.
 *
 * Shows a thin animated bar at the top of the viewport during route transitions.
 * Prevents the "nothing happened" feeling that causes users to double-click.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // When the URL changes, the navigation completed — reset
  useEffect(() => {
    setIsNavigating(false);
    setProgress(100);

    // Brief pause to show completion before hiding
    const hideTimeout = setTimeout(() => setProgress(0), 300);
    return () => clearTimeout(hideTimeout);
  }, [pathname, searchParams]);

  // Listen for click events on links and buttons that trigger navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      const button = target.closest('[role="button"], button, tr[tabindex]') as HTMLElement | null;

      // Internal link click
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('/api') &&
          href !== pathname &&
          !anchor.hasAttribute('download') &&
          anchor.target !== '_blank'
        ) {
          startProgress();
          return;
        }
      }

      // DataTable row click or card click that triggers navigation
      if (button && (button.closest('table') || button.getAttribute('role') === 'button')) {
        // Only trigger if the click handler likely calls router.push
        const isInsideTable = !!button.closest('table');
        if (isInsideTable) {
          startProgress();
        }
      }
    };

    const startProgress = () => {
      setIsNavigating(true);
      setProgress(20);

      // Gradually increase progress (never reaches 100 until navigation completes)
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + (90 - prev) * 0.1;
        });
      }, 200);

      // Safety timeout — if navigation takes too long, reset
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 10_000);
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  if (progress === 0) return null;

  return (
    <div
      className="fixed top-0 right-0 left-0 z-[9999] h-1"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="bg-primary h-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
      {isNavigating && (
        <div className="bg-primary/30 absolute top-0 right-0 h-full w-24 animate-pulse" />
      )}
    </div>
  );
}
