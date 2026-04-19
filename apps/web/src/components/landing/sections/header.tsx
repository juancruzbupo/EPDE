'use client';

import { Menu, Phone, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { LandingGeneral } from '@/types/landing-settings';

import { PHONE_DISPLAY, PHONE_NUMBER, PRIMARY_CTA_LABEL, WHATSAPP_URL } from '../landing-data';

/**
 * Orden del nav = orden de scroll de la landing. La arquitectura PAS
 * coloca credenciales (autoridad) ANTES del precio (value-first), por
 * lo que "Quién está detrás" va antes de "Qué incluye". Romper este
 * orden haría que el usuario salte arriba-abajo al clickear anchors.
 */
const NAV_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Quién está detrás', href: '#quien-esta-detras' },
  { label: 'Qué incluye', href: '#inversion' },
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

  // Close on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onHash = () => setMenuOpen(false);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [menuOpen]);

  return (
    <header className="border-border/50 bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <a href="#hero" className="font-heading text-primary text-xl" aria-label="Volver al inicio">
          EPDE
        </a>

        {/* Desktop nav — posicionado en absoluto + translate para quedar
            perfectamente centrado respecto al contenedor, independiente
            del ancho del logo (izq) y el bloque de acciones (der). Con
            flex justify-between solo, el nav se siente desplazado a la
            izquierda porque la CTA a la derecha es ~5× más ancha que
            el logo. */}
        <nav
          aria-label="Navegación principal"
          className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex"
        >
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

        {/* Desktop action — phone + primary CTA */}
        <div className="hidden items-center gap-2 md:flex">
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
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium shadow-sm transition-colors"
          >
            {PRIMARY_CTA_LABEL}
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
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="bg-background/95 animate-in fade-in slide-in-from-top-2 border-border/50 border-t backdrop-blur-md duration-200 md:hidden"
        >
          <nav aria-label="Menú móvil" className="mx-auto flex max-w-6xl flex-col px-4 py-2">
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
            <div className="mt-3 space-y-3 pb-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-11 w-full items-center justify-center rounded-md text-sm font-medium shadow-sm transition-colors"
              >
                {PRIMARY_CTA_LABEL}
              </a>
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
