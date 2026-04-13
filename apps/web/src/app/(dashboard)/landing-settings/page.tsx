'use client';

import type {
  LandingConsequenceExample,
  LandingFaqItem,
  LandingGeneral,
  LandingPricing,
} from '@epde/shared';
import { UserRole } from '@epde/shared';
import { useEffect } from 'react';

import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { useLandingSettings, useUpdateLandingSetting } from '@/hooks/use-landing-settings';
import { useAuthStore } from '@/stores/auth-store';

import { ConsequencesCard } from './components/consequences-card';
import { FaqCard } from './components/faq-card';
import { GeneralCard } from './components/general-card';
import { PricingCard } from './components/pricing-card';

const DEFAULT_PRICING: LandingPricing = {
  price: '$35.000',
  priceNote:
    'Válido para viviendas de tamaño estándar. Casas grandes o complejas pueden requerir evaluación adicional.',
  subscriptionMicrocopy:
    'Luego podés continuar con el monitoreo mensual si querés seguir manteniendo tu casa bajo control.',
  costDisclaimer:
    'Costos estimados en base a valores promedio de mercado en Paraná actualizados a marzo 2026. Los valores pueden variar según cada caso.',
};

const DEFAULT_FAQ: LandingFaqItem[] = [
  {
    question: '¿Cuánto dura el diagnóstico?',
    answer:
      'El relevamiento presencial lleva entre 2 y 4 horas, dependiendo del tamaño de la vivienda. El informe completo se entrega en 48-72 horas.',
  },
  {
    question: '¿Necesito estar presente durante la inspección?',
    answer:
      'Sí, es importante que estés durante el relevamiento para que podamos conversar sobre el historial de la vivienda y cualquier problema que hayas notado.',
  },
  {
    question: '¿El diagnóstico incluye reparaciones?',
    answer:
      'No. EPDE diagnostica y organiza. Si detectamos algo que requiere intervención, podés solicitar un presupuesto directamente desde la plataforma.',
  },
  {
    question: '¿Qué pasa después de los 6 meses de acceso?',
    answer:
      'Podés renovar la suscripción para seguir usando el sistema de seguimiento, recordatorios y actualización del ISV. El informe inicial es tuyo para siempre.',
  },
  {
    question: '¿Sirve para departamentos o solo casas?',
    answer:
      'Sirve para cualquier vivienda: casas, departamentos, dúplex y casas de campo. Adaptamos el diagnóstico a cada tipo de propiedad.',
  },
];

const DEFAULT_CONSEQUENCES: LandingConsequenceExample[] = [
  {
    problem: 'Filtración en techo',
    preventive: '$150.000 – $400.000',
    emergency: '$2.500.000 – $6.000.000',
  },
  {
    problem: 'Humedad de cimientos',
    preventive: '$300.000 – $800.000',
    emergency: '$3.500.000 – $9.000.000',
  },
  {
    problem: 'Falla eléctrica',
    preventive: '$80.000 – $180.000',
    emergency: '$1.200.000 – $3.500.000',
  },
];

const DEFAULT_GENERAL: LandingGeneral = {
  phone: '5493435043696',
  socialProof: 'Ya estamos trabajando con las primeras viviendas en Paraná',
};

export default function LandingSettingsPage() {
  useEffect(() => {
    document.title = 'Landing | EPDE';
  }, []);

  const user = useAuthStore((s) => s.user);
  const { data: settings, isLoading, isError, refetch } = useLandingSettings();
  const updateSetting = useUpdateLandingSetting();

  if (user?.role !== UserRole.ADMIN) {
    return (
      <ErrorState message="Acceso denegado" onRetry={() => (window.location.href = '/dashboard')} />
    );
  }

  const general: LandingGeneral = (settings?.data?.general as LandingGeneral) ?? DEFAULT_GENERAL;
  const pricing: LandingPricing = (settings?.data?.pricing as LandingPricing) ?? DEFAULT_PRICING;
  const faq: LandingFaqItem[] = (settings?.data?.faq as LandingFaqItem[]) ?? DEFAULT_FAQ;
  const consequences: LandingConsequenceExample[] =
    (settings?.data?.consequences as LandingConsequenceExample[]) ?? DEFAULT_CONSEQUENCES;

  return (
    <PageTransition>
      <PageHeader
        title="Configuración de Landing"
        description="Editá el precio, las preguntas frecuentes y los costos de consecuencias de la landing page."
      />

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonShimmer className="h-40 w-full" />
          <SkeletonShimmer className="h-60 w-full" />
          <SkeletonShimmer className="h-40 w-full" />
        </div>
      ) : isError ? (
        <ErrorState message="No se pudo cargar la configuración" onRetry={refetch} />
      ) : (
        <div className="space-y-6">
          <GeneralCard
            data={general}
            onSave={(value) => updateSetting.mutate({ key: 'general', value })}
            isPending={updateSetting.isPending}
          />
          <PricingCard
            data={pricing}
            onSave={(value) => updateSetting.mutate({ key: 'pricing', value })}
            isPending={updateSetting.isPending}
          />
          <FaqCard
            data={faq}
            onSave={(value) => updateSetting.mutate({ key: 'faq', value })}
            isPending={updateSetting.isPending}
          />
          <ConsequencesCard
            data={consequences}
            onSave={(value) => updateSetting.mutate({ key: 'consequences', value })}
            isPending={updateSetting.isPending}
          />
        </div>
      )}
    </PageTransition>
  );
}
