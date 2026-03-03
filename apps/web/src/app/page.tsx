import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/landing-page';

export const metadata: Metadata = {
  title: 'EPDE — Diagnóstico Arquitectónico y Mantenimiento Preventivo para Viviendas',
  description:
    'Servicio profesional de diagnóstico arquitectónico por Arq. Noelia E. Yuskowich. Planificación preventiva personalizada para viviendas unifamiliares con sistema digital de seguimiento.',
  keywords: [
    'diagnóstico arquitectónico',
    'mantenimiento preventivo vivienda',
    'planificación arquitectónica',
    'patologías edilicias',
    'mantenimiento preventivo casa',
    'diagnóstico edilicio',
  ],
  openGraph: {
    title: 'EPDE — Protegé el valor de tu vivienda con planificación arquitectónica moderna',
    description:
      'Diagnóstico arquitectónico personalizado por Arq. Noelia E. Yuskowich + plan de mantenimiento preventivo con seguimiento digital.',
    type: 'website',
  },
};

export default function Home() {
  return <LandingPage />;
}
