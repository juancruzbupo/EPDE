import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/landing-page';

export const metadata: Metadata = {
  title: 'EPDE - Mantenimiento Preventivo para Viviendas',
  description:
    'Plataforma profesional de diagnóstico y mantenimiento preventivo edilicio. Organizá el cuidado de tu vivienda con planes personalizados, presupuestos y seguimiento completo.',
  openGraph: {
    title: 'EPDE - Mantenimiento Preventivo para Viviendas',
    description: 'Organizá el cuidado de tu vivienda con planes de mantenimiento personalizados.',
    type: 'website',
  },
};

export default function Home() {
  return <LandingPage />;
}
