import { MessageCircle } from 'lucide-react';

import { WHATSAPP_URL } from '../landing-data';

/** WhatsApp brand colors (#25D366/#20BD5A) are hardcoded intentionally — not part of EPDE design tokens. */
export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar por WhatsApp"
      className="fixed right-4 bottom-6 z-50 hidden items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 shadow-lg transition-colors hover:bg-[#20BD5A] md:flex"
    >
      <MessageCircle className="h-6 w-6 text-white" fill="white" strokeWidth={0} />
      <span className="hidden text-sm font-medium text-white md:inline">Hablar por WhatsApp</span>
    </a>
  );
}
