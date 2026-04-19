import { formatARSCompact } from '@epde/shared';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';
import type { LandingPricing } from '@/types/landing-settings';

import type { SectionProps } from '../landing-data';
import {
  Check,
  COST_DISCLAIMER,
  INVESTMENT_FEATURES,
  LAUNCH_URGENCY_BANNER,
  PLAN_PRICE_TIERS,
  PRICE_NOTE,
  PRIMARY_CTA_LABEL,
  SUBSCRIPTION_MICROCOPY,
  WHATSAPP_URL,
} from '../landing-data';

interface InvestmentSectionProps extends SectionProps {
  pricing?: LandingPricing;
}

/**
 * Standalone market value for the diagnóstico solo (a partir del tier
 * SMALL de Inspección básica). Funciona como ancla de precio en la landing.
 */
const DIAGNOSTIC_STANDALONE_VALUE = 114750;

export function InvestmentSection({ motionProps, pricing }: InvestmentSectionProps) {
  const priceNote = pricing?.priceNote ?? PRICE_NOTE;
  const subscriptionMicrocopy = pricing?.subscriptionMicrocopy ?? SUBSCRIPTION_MICROCOPY;
  const cheapestLaunch = PLAN_PRICE_TIERS[0]?.launch ?? 55000;

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
            Un solo pago al empezar. Precio según tu casa.
          </motion.h2>
          <motion.p
            variants={FADE_IN}
            className="type-body-md text-muted-foreground mx-auto mt-4 max-w-2xl"
          >
            Solo el diagnóstico profesional firmado vale{' '}
            {formatARSCompact(DIAGNOSTIC_STANDALONE_VALUE)} aparte. Con el plan EPDE lo tenés
            incluido, más el sistema por 6 meses y el seguimiento.
          </motion.p>
        </div>

        {/* Launch urgency banner */}
        <motion.div
          variants={FADE_IN}
          className="border-primary/40 bg-primary/5 mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-lg border-l-4 p-4"
        >
          <AlertCircle className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-foreground text-sm leading-relaxed">
            <strong>{LAUNCH_URGENCY_BANNER}</strong>
          </p>
        </motion.div>

        {/* Tier cards */}
        <motion.div variants={FADE_IN_UP} className="mt-8 grid gap-4 sm:grid-cols-3">
          {PLAN_PRICE_TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              variants={STAGGER_ITEM}
              className={`border-border bg-card rounded-xl border p-5 ${
                i === 1 ? 'border-primary/40 ring-primary/20 ring-2' : ''
              }`}
            >
              {i === 1 && (
                <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                  Más común
                </p>
              )}
              <h3 className="font-heading text-foreground mt-1 text-lg">{tier.label}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">{tier.range}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-primary text-3xl font-bold tabular-nums">
                  {formatARSCompact(tier.launch)}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs tabular-nums line-through">
                después {formatARSCompact(tier.target)}
              </p>
              <p className="text-primary mt-3 text-xs font-medium">
                Precio de lanzamiento — pago único
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          variants={FADE_IN}
          className="text-muted-foreground/80 mx-auto mt-3 max-w-2xl text-center text-xs italic"
        >
          Más de 350 m² o casos atípicos (viviendas en altura, +3 plantas, acceso dificultoso): se
          cotizan aparte.
        </motion.p>

        {/* Two-column: benefits + CTA */}
        <div className="mt-12 grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          {/* Left: benefits list */}
          <motion.div variants={FADE_IN_UP} className="space-y-4">
            <p className="type-title-md text-foreground">Todo lo que incluye:</p>
            <div className="space-y-3">
              {INVESTMENT_FEATURES.map((feature) => (
                <motion.div
                  key={feature}
                  variants={STAGGER_ITEM}
                  className="flex items-start gap-3"
                >
                  <div className="bg-primary/10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    <Check className="text-primary h-3.5 w-3.5" />
                  </div>
                  <span className="type-body-md text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
            <div className="border-border space-y-2 border-t pt-4">
              <p className="type-body-sm text-muted-foreground">{subscriptionMicrocopy}</p>
            </div>
          </motion.div>

          {/* Right: CTA card */}
          <motion.div
            variants={FADE_IN_UP}
            className="border-primary/20 bg-primary/[0.03] rounded-2xl border-2 p-8 text-center"
          >
            <p className="type-label-md text-primary tracking-widest uppercase">
              Pedí tu cotización exacta
            </p>
            <p className="type-body-md text-muted-foreground mt-4 leading-relaxed">
              Contanos los metros cuadrados de tu casa y te confirmamos el tier y el precio exacto
              en el momento.
            </p>
            <p className="font-heading text-foreground mt-4 text-4xl tracking-tight sm:text-5xl">
              desde {formatARSCompact(cheapestLaunch)}
            </p>

            <div className="mt-6">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full gap-2">
                  {PRIMARY_CTA_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            <p className="type-body-sm text-muted-foreground/70 mt-4 text-left">{priceNote}</p>
          </motion.div>
        </div>

        {/* Bottom notes */}
        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-muted-foreground mx-auto mt-8 max-w-md text-center"
        >
          ¿Tenés más de una propiedad? Consultanos por un plan adaptado.
        </motion.p>
        <motion.p
          variants={FADE_IN}
          className="text-muted-foreground/70 mx-auto mt-3 max-w-2xl text-center text-xs"
        >
          {COST_DISCLAIMER}
        </motion.p>
      </motion.div>
    </section>
  );
}
