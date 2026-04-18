import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';
import type { LandingPricing } from '@/types/landing-settings';

import type { SectionProps } from '../landing-data';
import {
  Check,
  INVESTMENT_FEATURES,
  LAUNCH_PRICE,
  PRICE_NOTE,
  PRIMARY_CTA_LABEL,
  SUBSCRIPTION_MICROCOPY,
  WHATSAPP_URL,
} from '../landing-data';

interface InvestmentSectionProps extends SectionProps {
  pricing?: LandingPricing;
}

export function InvestmentSection({ motionProps, pricing }: InvestmentSectionProps) {
  const price = pricing?.price ?? LAUNCH_PRICE;
  const priceNote = pricing?.priceNote ?? PRICE_NOTE;
  const subscriptionMicrocopy = pricing?.subscriptionMicrocopy ?? SUBSCRIPTION_MICROCOPY;
  return (
    <section id="inversion" className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Inversión
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Todo esto por un pago único.
          </motion.h2>
        </div>

        {/* Two-column: benefits + price card */}
        <div className="mt-12 grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          {/* Left: benefits list */}
          <motion.div variants={FADE_IN_UP} className="space-y-4">
            <p className="type-title-md text-foreground">Tu diagnóstico incluye:</p>
            <div className="space-y-3">
              {INVESTMENT_FEATURES.map((feature) => (
                <motion.div
                  key={feature}
                  variants={STAGGER_ITEM}
                  className="flex items-center gap-3"
                >
                  <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    <Check className="text-primary h-3.5 w-3.5" />
                  </div>
                  <span className="type-body-md text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
            <div className="border-border space-y-2 border-t pt-4">
              <p className="type-body-sm text-foreground/80">
                Incluye acceso al sistema EPDE por 6 meses.
              </p>
              <p className="type-body-sm text-muted-foreground">{subscriptionMicrocopy}</p>
            </div>
          </motion.div>

          {/* Right: price card */}
          <motion.div
            variants={FADE_IN_UP}
            className="border-primary/20 bg-primary/[0.03] rounded-2xl border-2 p-8 text-center"
          >
            <p className="type-label-md text-primary tracking-widest uppercase">Pago único</p>
            <p className="type-body-md text-muted-foreground mt-4">
              <span className="line-through">$120.000</span>{' '}
              <span className="type-body-sm">(valor de mercado)</span>
            </p>
            <p className="font-heading text-foreground mt-1 text-5xl tracking-tight sm:text-6xl">
              {price}
            </p>
            <p className="type-body-sm text-primary mt-1 font-medium">Precio de lanzamiento</p>

            <div className="mt-8">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full gap-2">
                  {PRIMARY_CTA_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            <p className="type-body-sm text-muted-foreground/70 mt-4">{priceNote}</p>
          </motion.div>
        </div>

        {/* Bottom notes */}
        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-muted-foreground mx-auto mt-8 max-w-md text-center"
        >
          ¿Tenés más de una propiedad? Consultanos por planes multi-vivienda.
        </motion.p>
      </motion.div>
    </section>
  );
}
