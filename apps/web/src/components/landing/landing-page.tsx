'use client';

import type { LandingConsequenceExample, LandingFaqItem, LandingPricing } from '@epde/shared';

import { useMotionPreference } from '@/lib/motion';
import { useAuthStore } from '@/stores/auth-store';

import { ConsequenceSection } from './sections/consequence';
import { CredentialsSection } from './sections/credentials';
import { DeliverablesSection } from './sections/deliverables';
import { DifferentiationSection } from './sections/differentiation';
import { DigitalSystemSection } from './sections/digital-system';
import { FaqSection } from './sections/faq';
import { FinalCtaSection } from './sections/final-cta';
import { Footer } from './sections/footer';
import { Header } from './sections/header';
import { HeroSection } from './sections/hero';
import { HowItWorksSection } from './sections/how-it-works';
import { InvestmentSection } from './sections/investment';
import { IsvBlockSection } from './sections/isv-block';
import { ProblemsSection } from './sections/problems';
import { SolutionSection } from './sections/solution';
import { TargetAudienceSection } from './sections/target-audience';
import { UrgencySection } from './sections/urgency';
import { WhatsAppFloat } from './sections/whatsapp-float';

interface LandingPageProps {
  settings?: {
    pricing?: LandingPricing;
    faq?: LandingFaqItem[];
    consequences?: LandingConsequenceExample[];
  } | null;
}

export function LandingPage({ settings }: LandingPageProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { shouldAnimate } = useMotionPreference();

  const ctaHref = isLoading ? '/login' : isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? 'Ir al Dashboard' : 'Iniciar Sesión';

  const motionProps = shouldAnimate
    ? {
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport: { once: true, margin: '-60px' },
      }
    : {};

  return (
    <div className="landing flex min-h-screen flex-col pb-16 md:pb-0">
      <Header ctaHref={ctaHref} ctaLabel={ctaLabel} />
      {/* 1. Hook — por qué importa */}
      <HeroSection motionProps={motionProps} />
      {/* 2. Problema — deterioro invisible */}
      <ProblemsSection motionProps={motionProps} />
      {/* 3. Consecuencia — cuánto sale no prevenir */}
      <ConsequenceSection
        motionProps={motionProps}
        consequences={settings?.consequences}
        costDisclaimer={settings?.pricing?.costDisclaimer}
      />
      {/* 4. Solución — qué es EPDE */}
      <SolutionSection motionProps={motionProps} />
      {/* 5. ISV — el indicador con interpretación */}
      <IsvBlockSection motionProps={motionProps} />
      {/* 6. Cómo funciona — 3 pasos */}
      <HowItWorksSection motionProps={motionProps} />
      {/* 7. Qué incluye — entregables */}
      <DeliverablesSection motionProps={motionProps} />
      {/* 8. Sistema — la plataforma */}
      <DigitalSystemSection motionProps={motionProps} />
      {/* 9. Comparación */}
      <DifferentiationSection motionProps={motionProps} />
      {/* 10. Credenciales */}
      <CredentialsSection motionProps={motionProps} />
      {/* 11. Para quién */}
      <TargetAudienceSection motionProps={motionProps} />
      {/* 11b. FAQ */}
      <FaqSection motionProps={motionProps} faq={settings?.faq} />
      {/* 12. Pricing */}
      <InvestmentSection motionProps={motionProps} pricing={settings?.pricing} />
      {/* 13. Urgencia */}
      <UrgencySection motionProps={motionProps} />
      {/* 14. CTA final */}
      <FinalCtaSection motionProps={motionProps} price={settings?.pricing?.price} />
      <Footer />
      {/* Floating WhatsApp */}
      <WhatsAppFloat />
    </div>
  );
}
