'use client';

import { WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import { BookOpen, HelpCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Persistent support footer. Generational audit flagged that older users look for a
 * visible 'contact support' option as a signal of trust — if they can't find one,
 * they assume the app is broken. Keep this accessible on every dashboard page.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-border text-muted-foreground mt-8 border-t px-4 py-4 text-xs sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {year} EPDE — Estudio Profesional de Diagnóstico Edilicio</p>
        <nav aria-label="Soporte" className="flex flex-wrap items-center gap-3">
          <Link
            href="/guide"
            className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Guía de uso
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-glossary'))}
            className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Glosario
          </button>
          <a
            href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent(
              'Hola, necesito ayuda con EPDE',
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Contactar por WhatsApp
          </a>
        </nav>
      </div>
    </footer>
  );
}
