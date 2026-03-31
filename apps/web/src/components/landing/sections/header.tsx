'use client';

import type { LandingGeneral } from '@epde/shared';
import { Menu, Phone, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { PHONE_DISPLAY, PHONE_NUMBER } from '../landing-data';

const NAV_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Qué incluye', href: '#que-incluye' },
  { label: 'Precio', href: '#inversion' },
  { label: 'Contacto', href: '#contacto' },
];

function formatPhoneDisplay(phone: string): string {
  // "5493435043696" → "343 504-3696"
  const local = phone.replace(/^549/, '');
  if (local.length === 10) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`;
  }
  return phone;
}

interface HeaderProps {
  general?: LandingGeneral;
}

export function Header({ general }: HeaderProps) {
  const phone = general?.phone || PHONE_NUMBER;
  const phoneDisplay = general?.phone ? formatPhoneDisplay(general.phone) : PHONE_DISPLAY;
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onHash = () => setMenuOpen(false);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [menuOpen]);

  return (
    <header className="border-border/50 bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <a href="#" className="font-heading text-primary text-xl">
          EPDE
        </a>

        {/* Desktop nav — centered */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop action — phone only */}
        <div className="hidden items-center md:flex">
          <a
            href={`tel:+${phone}`}
            className="text-muted-foreground hover:text-foreground group relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            aria-label={`Llamar al ${phoneDisplay}`}
          >
            <Phone className="h-4 w-4" />
            <span className="bg-foreground text-background pointer-events-none absolute top-full mt-2 rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
              {phoneDisplay}
            </span>
          </a>
        </div>

        {/* Mobile: phone icon + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <a
            href={`tel:+${phone}`}
            className="text-muted-foreground hover:text-foreground flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            aria-label={`Llamar al ${phoneDisplay}`}
          >
            <Phone className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-foreground flex h-9 w-9 items-center justify-center rounded-full"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="bg-background/95 animate-in fade-in slide-in-from-top-2 border-border/50 border-t backdrop-blur-md duration-200 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="text-foreground hover:text-primary border-border/20 border-b py-3.5 text-[15px] transition-colors last:border-b-0"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 pb-2">
              <a
                href={`tel:+${phone}`}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 py-1 text-sm transition-colors"
              >
                <Phone className="h-4 w-4" />
                Llamanos: {phoneDisplay}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
