import { MessageCircle } from 'lucide-react';

import { WHATSAPP_URL } from '../landing-data';

/**
 * WhatsApp brand colors (#25D366/#20BD5A) are hardcoded intentionally —
 * not part of EPDE design tokens.
 *
 * Visible on ALL viewports. Previously hidden below md: breakpoint, but the
 * re-ux-audit flagged that older users (who arrive via a WhatsApp message
 * from family) land on the mobile landing and need the contact CTA
 * immediately visible — burying it behind scrolling was killing trust on
 * the device they use most. On mobile the FAB shows only the icon; the
 * text label stays md+ only to avoid crowding.
 */
export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar por WhatsApp"
      className="fixed right-4 bottom-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] p-3 shadow-lg transition-colors hover:bg-[#20BD5A] md:px-4 md:py-3"
    >
      <MessageCircle className="h-6 w-6 text-white" fill="white" strokeWidth={0} />
      <span className="hidden text-sm font-medium text-white md:inline">Hablar por WhatsApp</span>
    </a>
  );
}
