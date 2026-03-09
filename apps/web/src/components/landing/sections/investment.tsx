import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fadeIn, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import {
  Check,
  INVESTMENT_FEATURES,
  PRICE_DISCLAIMER,
  PRICE_TIERS,
  WHATSAPP_URL,
} from '../landing-data';

export function InvestmentSection({ motionProps }: SectionProps) {
  return (
    <section id="inversion" className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <motion.p
            variants={fadeIn}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Inversión
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            ¿Cuánto cuesta un diagnóstico preventivo?
          </motion.h2>
          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
          >
            El valor depende de la superficie y complejidad técnica de tu vivienda.
          </motion.p>
        </div>

        {/* Price tiers */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PRICE_TIERS.map((tier) => (
            <motion.div
              key={tier.label}
              variants={staggerItem}
              className="border-border bg-card rounded-xl border p-6 text-center"
            >
              <h3 className="type-title-md text-foreground">{tier.label}</h3>
              <p className="type-body-lg text-primary mt-3 font-semibold">{tier.range}</p>
            </motion.div>
          ))}
        </div>

        {/* Features card */}
        <motion.div
          variants={fadeInUp}
          className="border-primary/20 bg-primary/[0.03] mt-10 rounded-2xl border-2 p-8 sm:p-12"
        >
          <p className="type-title-md text-foreground mb-6 text-center">
            Qué incluye el diagnóstico
          </p>
          <div className="space-y-3">
            {INVESTMENT_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="text-primary h-3 w-3" />
                </div>
                <span className="type-body-lg text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                Solicitar diagnóstico
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.p
          variants={fadeIn}
          className="type-body-sm text-muted-foreground/70 mx-auto mt-8 max-w-3xl text-center"
        >
          {PRICE_DISCLAIMER}
        </motion.p>
      </motion.div>
    </section>
  );
}
