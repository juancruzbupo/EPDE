import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  ctaHref: string;
  ctaLabel: string;
}

export function Header({ ctaHref, ctaLabel }: HeaderProps) {
  return (
    <header className="border-border/50 bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16">
        <span className="font-heading text-primary text-xl">EPDE</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href={ctaHref}>
            <Button variant="ghost" size="sm">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
