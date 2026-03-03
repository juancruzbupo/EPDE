import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/landing-page';

export const metadata: Metadata = {
  title: 'EPDE — Diagnóstico y Mantenimiento Preventivo Profesional para Viviendas',
  description:
    'Servicio profesional de diagnóstico arquitectónico y planificación preventiva personalizada para viviendas. Evaluación técnica integral con sistema digital de seguimiento.',
  openGraph: {
    title: 'EPDE — La nueva forma profesional de cuidar tu casa',
    description:
      'Diagnóstico arquitectónico personalizado + plan de mantenimiento preventivo con seguimiento en sistema digital.',
    type: 'website',
  },
};

export default function Home() {
  return <LandingPage />;
}
