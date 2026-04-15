'use client';

import { WHATSAPP_CONTACT_NUMBER } from '@epde/shared';
import { AlertTriangle, BookOpen, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  className?: string;
  /**
   * When `critical`, the error card also shows a "Contactar por WhatsApp"
   * link pre-filled with a help message. Use for failures the user can't
   * resolve themselves (500s, unreachable backend, missing subscription).
   */
  severity?: 'default' | 'critical';
  /**
   * When true, shows a "Ver glosario de términos" link that opens the
   * glossary modal. Use on screens where the error might leave the user
   * confused about what a term means (ISV, condición, sector, etc.).
   */
  showGlossaryLink?: boolean;
}

export function ErrorState({
  message,
  onRetry,
  className,
  severity = 'default',
  showGlossaryLink = false,
}: ErrorStateProps) {
  const waMessage = encodeURIComponent(
    `Hola! Estoy teniendo un problema con la app EPDE: "${message}". ¿Me pueden ayudar?`,
  );

  return (
    <div role="alert" className={cn('flex flex-col items-center gap-2 py-8', className)}>
      <AlertTriangle className="text-destructive h-8 w-8" aria-hidden="true" />
      <p className="text-muted-foreground text-sm">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => void onRetry()}>
          Reintentar
        </Button>
        {severity === 'critical' && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Contactar por WhatsApp
            </a>
          </Button>
        )}
        {showGlossaryLink && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent('open-glossary'))}
          >
            <BookOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Ver glosario
          </Button>
        )}
      </div>
    </div>
  );
}
