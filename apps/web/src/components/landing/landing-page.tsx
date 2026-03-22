'use client';

import { useMotionPreference } from '@/lib/motion';
import { useAuthStore } from '@/stores/auth-store';

import { ConsequenceSection } from './sections/consequence';
import { CredentialsSection } from './sections/credentials';
import { DeliverablesSection } from './sections/deliverables';
import { DifferentiationSection } from './sections/differentiation';
import { DigitalSystemSection } from './sections/digital-system';
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

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuthStore();
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
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Header ctaHref={ctaHref} ctaLabel={ctaLabel} />
      {/* 1. Hook — qué es y por qué importa */}
      <HeroSection motionProps={motionProps} />
      {/* 2. Problema — por qué necesitás esto */}
      <ProblemsSection motionProps={motionProps} />
      {/* 3. Consecuencia — cuánto sale no prevenir */}
      <ConsequenceSection motionProps={motionProps} />
      {/* 4. Solución — qué es EPDE */}
      <SolutionSection motionProps={motionProps} />
      {/* 5. ISV — el indicador clave */}
      <IsvBlockSection motionProps={motionProps} />
      {/* 6. Cómo funciona — 3 pasos */}
      <HowItWorksSection motionProps={motionProps} />
      {/* 7. Qué incluye — entregables concretos */}
      <DeliverablesSection motionProps={motionProps} />
      {/* 8. Sistema — la plataforma digital */}
      <DigitalSystemSection motionProps={motionProps} />
      {/* 9. Comparación — tradicional vs EPDE */}
      <DifferentiationSection motionProps={motionProps} />
      {/* 10. Credenciales — quién está detrás */}
      <CredentialsSection motionProps={motionProps} />
      {/* 11. Para quién — target */}
      <TargetAudienceSection motionProps={motionProps} />
      {/* 12. Pricing */}
      <InvestmentSection motionProps={motionProps} />
      {/* 13. Urgencia */}
      <UrgencySection motionProps={motionProps} />
      {/* 14. CTA final */}
      <FinalCtaSection motionProps={motionProps} />
      <Footer />
    </div>
  );
}
