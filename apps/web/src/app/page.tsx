import type { Metadata } from 'next';

import { LandingPage } from '@/components/landing/landing-page';
import { fetchLandingSettings } from '@/lib/api/landing-settings-public';

/** Force dynamic rendering — landing fetches settings from API which is not available at build time. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'EPDE — Diagnóstico Profesional de Viviendas | Mantenimiento Preventivo',
  description:
    'Diagnóstico profesional para saber cómo está tu casa. Detectamos problemas ocultos, calculamos el Índice de Salud de la Vivienda y organizamos todo el mantenimiento. Precio lanzamiento $35.000.',
  keywords: [
    'diagnóstico vivienda',
    'mantenimiento preventivo casa',
    'inspección de vivienda',
    'diagnóstico edilicio',
    'patologías edilicias',
    'índice de salud vivienda',
    'mantenimiento preventivo vivienda',
    'EPDE Paraná',
  ],
  openGraph: {
    title: 'EPDE — Diagnóstico profesional para saber cómo está tu casa',
    description:
      'Evaluamos tu vivienda completa, detectamos problemas ocultos y organizamos todo su mantenimiento en un sistema inteligente. Precio lanzamiento $35.000.',
    type: 'website',
  },
};

export default async function Home() {
  const settings = await fetchLandingSettings();
  return <LandingPage settings={settings} />;
}
