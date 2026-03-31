import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { PRIMARY_CTA_LABEL, WHATSAPP_URL } from '../landing-data';

export function HeroSection({ motionProps }: SectionProps) {
  return (
    <section className="pt-28 pb-20 md:pt-44 md:pb-28">
      <motion.div
        variants={STAGGER_CONTAINER}
        {...motionProps}
        className="mx-auto max-w-5xl px-4 text-center"
      >
        {/* Micro-hook */}
        <motion.p variants={FADE_IN} className="type-body-md text-foreground/90 mb-4 font-medium">
          La mayoría de las casas tiene problemas que no se ven.
        </motion.p>

        <motion.h1
          variants={FADE_IN_UP}
          className="font-heading text-foreground text-4xl leading-[1.1] tracking-tight sm:text-5xl sm:leading-[1.15] md:text-6xl lg:text-7xl lg:leading-[1.12]"
        >
          Podés estar perdiendo plata
          <br />
          <span className="text-primary">en tu casa sin darte cuenta.</span>
        </motion.h1>

        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-foreground/80 mx-auto mt-6 max-w-2xl font-medium"
        >
          Te ayudamos a identificar problemas antes de que se vuelvan costosos y organizamos todo el
          mantenimiento de tu vivienda. Vos tomás las decisiones, nosotros hacemos el seguimiento.
        </motion.p>

        <motion.div
          variants={FADE_IN}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          {/* Primary CTA hidden on mobile — sticky footer handles it */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block"
          >
            <Button size="lg" className="gap-2">
              {PRIMARY_CTA_LABEL}
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

        {/* WhatsApp direct link */}
        <motion.div variants={FADE_IN} className="mt-4">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Hablar por WhatsApp
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-primary mx-auto mt-6 max-w-md rounded-full border border-current/20 bg-current/5 px-4 py-1.5 font-medium"
        >
          Ya estamos trabajando con las primeras viviendas en Paraná
        </motion.p>
      </motion.div>
    </section>
  );
}
