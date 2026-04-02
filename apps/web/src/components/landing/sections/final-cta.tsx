import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { LAUNCH_PRICE, PRIMARY_CTA_LABEL, WHATSAPP_URL } from '../landing-data';

interface FinalCtaSectionProps extends SectionProps {
  price?: string;
}

export function FinalCtaSection({ motionProps, price }: FinalCtaSectionProps) {
  return (
    <section id="contacto" className="bg-foreground py-20 md:py-28">
      <motion.div
        variants={STAGGER_CONTAINER}
        {...motionProps}
        className="mx-auto max-w-3xl px-4 text-center"
      >
        <motion.h2
          variants={FADE_IN_UP}
          className="font-heading text-background text-3xl sm:text-4xl"
        >
          Tu casa necesita atención profesional.
        </motion.h2>
        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-background/70 mx-auto mt-6 max-w-lg"
        >
          Por {price ?? LAUNCH_PRICE}, una arquitecta inspecciona tu vivienda y te arma un plan
          completo de mantenimiento.
        </motion.p>
        <motion.div variants={FADE_IN} className="mt-8">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="secondary" className="gap-2">
              {PRIMARY_CTA_LABEL}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <p className="type-body-sm text-background/40 mt-3">
            Cupos limitados por semana. Respondemos en menos de 24 horas.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
