import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { WHATSAPP_URL } from '../landing-data';

export function HeroSection({ motionProps }: SectionProps) {
  return (
    <section className="pt-32 pb-20 md:pt-44 md:pb-28">
      <motion.div
        variants={STAGGER_CONTAINER}
        {...motionProps}
        className="mx-auto max-w-5xl px-4 text-center"
      >
        <motion.h1
          variants={FADE_IN_UP}
          className="font-heading text-foreground text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          El mantenimiento preventivo que evita
          <br />
          <span className="text-primary">problemas costosos en tu casa.</span>
        </motion.h1>

        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-foreground/80 mx-auto mt-5 max-w-2xl font-medium"
        >
          Un problema chico hoy puede costarte millones mañana.
        </motion.p>

        <motion.p
          variants={FADE_IN}
          className="type-body-md text-muted-foreground mx-auto mt-4 max-w-2xl"
        >
          Detectamos filtraciones, humedad, problemas eléctricos y fallas comunes antes de que se
          conviertan en reparaciones caras.
        </motion.p>

        <motion.div
          variants={FADE_IN}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2">
              Quiero saber el estado de mi casa
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="gap-2">
              Consultar por WhatsApp
            </Button>
          </a>
        </motion.div>
        <motion.p variants={FADE_IN} className="text-muted-foreground mt-4 text-center text-sm">
          ¿Preferís email?{' '}
          <a href="mailto:contacto@epde.com.ar" className="text-primary hover:underline">
            contacto@epde.com.ar
          </a>
        </motion.p>
      </motion.div>
    </section>
  );
}
