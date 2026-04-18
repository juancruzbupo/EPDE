'use client';

import { useMotionPreference } from '@/lib/motion';
import type {
  LandingConsequenceExample,
  LandingFaqItem,
  LandingGeneral,
  LandingPricing,
} from '@/types/landing-settings';

import { CertificateSection } from './sections/certificate';
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
import { MobileStickyCta } from './sections/mobile-sticky-cta';
import { ScrollToTop } from './sections/scroll-to-top';
import { TechnicalInspectionSection } from './sections/technical-inspection';
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
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:px-4 focus:py-2"
      >
        Ir al contenido
      </a>
      <Header general={settings?.general} />
      <main id="main-content">
        {/* 1. Hero — qué es EPDE + CTA */}
        <HeroSection motionProps={motionProps} socialProof={settings?.general?.socialProof} />
        {/* 2. Consecuencias — activa el dolor temprano (PAS: Problem + Agitation).
         *    Scroll-depth ~85% alcanza esta posición vs 50% si va más abajo. */}
        <ConsequenceSection
          motionProps={motionProps}
          consequences={settings?.consequences}
          costDisclaimer={settings?.pricing?.costDisclaimer}
        />
        {/* 3. Cómo funciona — ahora que sintió el dolor, mostramos la solución */}
        <HowItWorksSection motionProps={motionProps} />
        {/* 4. Demo — así se ve la herramienta */}
        <DemoSection motionProps={motionProps} />
        {/* 5. Diferenciación — responde la objeción "¿para qué pago si llamo al
         *    plomero cuando se rompe algo?" en el momento que aparece mentalmente */}
        <DifferentiationSection motionProps={motionProps} />
        {/* 6. Credenciales — autoridad (Noelia matriculada) antes del pedido monetario */}
        <CredentialsSection motionProps={motionProps} />
        {/* 7. Testimonios — prueba social */}
        <TestimonialsSection motionProps={motionProps} />
        {/* 8. Certificado — bonus de largo plazo, refuerza credibilidad final */}
        <CertificateSection motionProps={motionProps} />
        {/* 9. Inversión — precio recién acá, con motivación + autoridad + prueba
         *    social construidas. "Value-first evaluation" en vez de "price-first". */}
        <InvestmentSection motionProps={motionProps} pricing={settings?.pricing} />
        {/* 10. Inspección técnica — add-on pago para clientes EPDE (15% off).
         *    Post-precio a propósito: no compite con la decisión del plan principal.
         *    Refuerza el valor para los que todavía dudan ("además tenés -15% aparte")
         *    y queda registrado como servicio extra para los ya convencidos. */}
        <TechnicalInspectionSection motionProps={motionProps} />
        {/* 11. FAQ — últimas objeciones antes del cierre */}
        <FaqSection motionProps={motionProps} faq={settings?.faq} />
        {/* 12. CTA final */}
        <FinalCtaSection motionProps={motionProps} price={settings?.pricing?.price} />
      </main>
      <Footer general={settings?.general} />
      {/* Floating buttons */}
      <ScrollToTop />
      <WhatsAppFloat />
      <MobileStickyCta />
    </div>
  );
}
