'use client';

import type {
  LandingConsequenceExample,
  LandingFaqItem,
  LandingGeneral,
  LandingPricing,
} from '@epde/shared';

import { useMotionPreference } from '@/lib/motion';

import { ConsequenceSection } from './sections/consequence';
import { CredentialsSection } from './sections/credentials';
import { DemoSection } from './sections/demo';
import { DifferentiationSection } from './sections/differentiation';
import { FaqSection } from './sections/faq';
import { FinalCtaSection } from './sections/final-cta';
import { Footer } from './sections/footer';
import { Header } from './sections/header';
import { HeroSection } from './sections/hero';
import { HowItWorksSection } from './sections/how-it-works';
import { InvestmentSection } from './sections/investment';
import { ScrollToTop } from './sections/scroll-to-top';
import { TestimonialsSection } from './sections/testimonials';
import { WhatsAppFloat } from './sections/whatsapp-float';

interface LandingPageProps {
  settings?: {
    pricing?: LandingPricing;
    faq?: LandingFaqItem[];
    consequences?: LandingConsequenceExample[];
    general?: LandingGeneral;
  } | null;
}

export function LandingPage({ settings }: LandingPageProps) {
  const { shouldAnimate } = useMotionPreference();

  const motionProps = shouldAnimate
    ? {
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport: { once: true, margin: '-60px' },
      }
    : {};

  return (
    <div className="landing flex min-h-screen flex-col">
      <Header general={settings?.general} />
      {/* 1. Hero — qué es EPDE + CTA */}
      <HeroSection motionProps={motionProps} socialProof={settings?.general?.socialProof} />
      {/* 2. Cómo funciona — 3 pasos claros */}
      <HowItWorksSection motionProps={motionProps} />
      {/* 3. Demo — así se ve la herramienta */}
      <DemoSection motionProps={motionProps} />
      {/* 4. Inversión — beneficios + precio lado a lado */}
      <InvestmentSection motionProps={motionProps} pricing={settings?.pricing} />
      {/* 5. Consecuencias — por qué prevenir */}
      <ConsequenceSection
        motionProps={motionProps}
        consequences={settings?.consequences}
        costDisclaimer={settings?.pricing?.costDisclaimer}
      />
      {/* 6. Testimonios — prueba social real */}
      <TestimonialsSection motionProps={motionProps} />
      {/* 7. Credenciales — quién está detrás */}
      <CredentialsSection motionProps={motionProps} />
      {/* 6. Comparación — tradicional vs EPDE */}
      <DifferentiationSection motionProps={motionProps} />
      {/* 7. FAQ */}
      <FaqSection motionProps={motionProps} faq={settings?.faq} />
      {/* 8. CTA final */}
      <FinalCtaSection motionProps={motionProps} price={settings?.pricing?.price} />
      <Footer general={settings?.general} />
      {/* Floating buttons */}
      <ScrollToTop />
      <WhatsAppFloat />
    </div>
  );
}
