'use client';

import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PRIMARY_CTA_LABEL, WHATSAPP_URL } from '../landing-data';

/**
 * Sticky CTA bar que aparece en mobile después de scrollear >1 pantalla,
 * y se oculta cuando el footer entra en viewport (para no tapar contacto).
 * Desktop tiene header CTA + botones inline, no necesita este refuerzo.
 */
export function MobileStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY > window.innerHeight * 0.8;
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 400;
      setVisible(scrolled && !nearBottom);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 transition-all duration-300 md:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-primary text-primary-foreground hover:bg-primary/90 pointer-events-auto flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full text-sm font-semibold shadow-lg shadow-black/20 transition-colors"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {PRIMARY_CTA_LABEL} por WhatsApp
      </a>
    </div>
  );
}
