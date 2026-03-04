import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/landing-page';

export const metadata: Metadata = {
  title: 'EPDE — Mantenimiento Preventivo para Viviendas | Arq. Noelia E. Yuskowich',
  description:
    'Diagnóstico arquitectónico profesional y plan de mantenimiento preventivo con seguimiento digital. Detectamos problemas antes de que sean urgencias. Cupos limitados.',
  keywords: [
    'mantenimiento preventivo vivienda',
    'diagnóstico arquitectónico',
    'patologías edilicias',
    'mantenimiento preventivo casa',
    'diagnóstico edilicio',
    'inspección de vivienda',
    'plan de mantenimiento casa',
    'prevención humedades',
  ],
  openGraph: {
    title: 'EPDE — Detectamos problemas en tu vivienda antes de que sean urgencias',
    description:
      'Diagnóstico arquitectónico profesional + plan preventivo personalizado + seguimiento digital. Por Arq. Noelia E. Yuskowich.',
    type: 'website',
  },
};

export default function Home() {
  return <LandingPage />;
}
