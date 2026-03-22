import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';

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
          Sabé realmente
          <br />
          <span className="text-primary">cómo está tu casa.</span>
        </motion.h1>

        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-foreground/80 mx-auto mt-6 max-w-2xl font-medium"
        >
          EPDE diagnostica tu vivienda, detecta problemas ocultos y organiza todo su mantenimiento
          en un sistema inteligente. Un solo diagnóstico puede evitarte gastos de millones.
        </motion.p>

        <motion.div
          variants={FADE_IN}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2">
              Solicitar diagnóstico
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <a href="#como-funciona">
            <Button size="lg" variant="outline" className="gap-2">
              Ver cómo funciona
              <ArrowDown className="h-4 w-4" />
            </Button>
          </a>
        </motion.div>

        <motion.p variants={FADE_IN} className="text-muted-foreground mt-6 text-center text-sm">
          ¿Preferís email?{' '}
          <a href="mailto:contacto@epde.com.ar" className="text-primary hover:underline">
            contacto@epde.com.ar
          </a>
        </motion.p>
      </motion.div>
    </section>
  );
}
