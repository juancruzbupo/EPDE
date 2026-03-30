import type { LandingPricing } from '@epde/shared';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER } from '@/lib/motion';

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
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-3xl px-4">
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
            Diagnóstico EPDE
          </motion.h2>
          {/* Pre-price value framing */}
          <motion.p
            variants={FADE_IN}
            className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-xl"
          >
            El objetivo de EPDE es evitar problemas que pueden volverse mucho más costosos con el
            tiempo.
          </motion.p>
        </div>

        {/* Single price card */}
        <motion.div
          variants={FADE_IN_UP}
          className="border-primary/20 bg-primary/[0.03] mx-auto mt-10 max-w-md rounded-2xl border-2 p-8 text-center sm:p-12"
        >
          <p className="type-label-md text-primary tracking-widest uppercase">Pago único</p>
          <p className="type-body-md text-muted-foreground mt-4 line-through">$120.000</p>
          <p className="font-heading text-foreground mt-1 text-5xl tracking-tight sm:text-6xl">
            {price}
          </p>
          <p className="type-body-sm text-primary mt-1 font-medium">Precio de lanzamiento</p>

          <div className="mt-8 space-y-3 text-left">
            {INVESTMENT_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="text-primary h-3 w-3" />
                </div>
                <span className="type-body-md text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Emotional close before CTA */}
          <p className="type-body-sm text-foreground/70 mx-auto mt-6 max-w-xs font-medium italic">
            Una inversión pequeña hoy para proteger tu patrimonio a largo plazo.
          </p>

          <div className="mt-6 space-y-3">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full gap-2">
                {PRIMARY_CTA_LABEL}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 text-sm transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Hablar por WhatsApp
            </a>
          </div>
        </motion.div>

        {/* Subscription microcopy */}
        <motion.p
          variants={FADE_IN}
          className="type-body-md text-foreground/80 mx-auto mt-6 max-w-md text-center"
        >
          Incluye acceso al sistema EPDE por 6 meses.
        </motion.p>
        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-muted-foreground mx-auto mt-1 max-w-md text-center"
        >
          {subscriptionMicrocopy}
        </motion.p>
        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-muted-foreground mx-auto mt-1 max-w-md text-center"
        >
          ¿Tenés más de una propiedad? Consultanos por planes multi-vivienda.
        </motion.p>

        {/* Interventions note */}
        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-foreground/70 mx-auto mt-6 max-w-md text-center font-medium"
        >
          Las intervenciones específicas se cotizan aparte según necesidad.
        </motion.p>

        {/* Size note */}
        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-muted-foreground/70 mx-auto mt-4 max-w-md text-center"
        >
          {priceNote}
        </motion.p>
      </motion.div>
    </section>
  );
}
