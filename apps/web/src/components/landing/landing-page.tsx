'use client';

import { useMotionPreference } from '@/lib/motion';
import { useAuthStore } from '@/stores/auth-store';

import { CostComparisonSection } from './sections/cost-comparison';
import { CredentialsSection } from './sections/credentials';
import { DeliverablesSection } from './sections/deliverables';
import { DigitalSystemSection } from './sections/digital-system';
import { FinalCtaSection } from './sections/final-cta';
import { Footer } from './sections/footer';
import { Header } from './sections/header';
import { HeroSection } from './sections/hero';
import { HowItWorksSection } from './sections/how-it-works';
import { ImmediatePromiseSection } from './sections/immediate-promise';
import { InvestmentSection } from './sections/investment';
import { ProblemsSection } from './sections/problems';
import { RealExampleSection } from './sections/real-example';
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
      <HeroSection motionProps={motionProps} />
      <ImmediatePromiseSection motionProps={motionProps} />
      <ProblemsSection motionProps={motionProps} />
      <CostComparisonSection motionProps={motionProps} />
      <HowItWorksSection motionProps={motionProps} />
      <DigitalSystemSection motionProps={motionProps} />
      <RealExampleSection motionProps={motionProps} />
      <CredentialsSection motionProps={motionProps} />
      <DeliverablesSection motionProps={motionProps} />
      <TargetAudienceSection motionProps={motionProps} />
      <UrgencySection motionProps={motionProps} />
      <InvestmentSection motionProps={motionProps} />
      <FinalCtaSection motionProps={motionProps} />
      <Footer />
    </div>
  );
}
