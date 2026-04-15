'use client';

import { Check, Copy, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface ReferralsShareActionsProps {
  referralCode: string;
  referralUrl: string;
}

type CopyTarget = 'code' | 'url' | null;

/**
 * Share actions for the referral code: copy the code, copy the full
 * share link, or open WhatsApp with a pre-filled invite message. All
 * three are read-only from React Query's point of view — they don't
 * mutate server state, so there's no invalidation / toast.error
 * rollback to coordinate.
 *
 * Copy feedback is a 2s inline swap of the icon + sonner toast so the
 * user can't miss that the action worked even if the toast layer is
 * covered.
 */
export function ReferralsShareActions({ referralCode, referralUrl }: ReferralsShareActionsProps) {
  const [justCopied, setJustCopied] = useState<CopyTarget>(null);

  async function copy(text: string, target: CopyTarget, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      setJustCopied(target);
      setTimeout(() => setJustCopied((current) => (current === target ? null : current)), 2000);
    } catch {
      toast.error('No pudimos copiar. Seleccioná el texto manualmente.');
    }
  }

  const whatsappMessage = encodeURIComponent(
    `Hola! Te recomiendo EPDE, un servicio de diagnóstico preventivo para tu casa. ` +
      `Si te sumás con mi código ${referralCode} tenés 10% de descuento. Mirá: ${referralUrl}`,
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => copy(referralCode, 'code', 'Código copiado')}
      >
        {justCopied === 'code' ? (
          <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />
        ) : (
          <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        Copiar código
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => copy(referralUrl, 'url', 'Link copiado')}
      >
        {justCopied === 'url' ? (
          <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />
        ) : (
          <LinkIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
        )}
        Copiar link
      </Button>

      <Button asChild size="sm">
        <a
          href={`https://wa.me/?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Compartir por WhatsApp
        </a>
      </Button>
    </div>
  );
}
