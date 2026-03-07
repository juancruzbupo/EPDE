import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fadeIn, fadeInUp, staggerContainer } from '@/lib/motion';
import type { SectionProps } from '../landing-data';
import { WHATSAPP_URL } from '../landing-data';

export function FinalCtaSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-foreground py-20 md:py-28">
      <motion.div
        variants={staggerContainer}
        {...motionProps}
        className="mx-auto max-w-3xl px-4 text-center"
      >
        <motion.h2
          variants={fadeInUp}
          className="font-heading text-background text-3xl sm:text-4xl"
        >
          Tu vivienda no necesita más arreglos.
          <br />
          Necesita un sistema.
        </motion.h2>
        <motion.p
          variants={fadeIn}
          className="type-body-lg text-background/70 mx-auto mt-6 max-w-lg"
        >
          Evaluamos el estado de tu vivienda y te indicamos qué mantenimiento necesita. Sin
          compromiso.
        </motion.p>
        <motion.p
          variants={fadeIn}
          className="type-body-md text-background/50 mx-auto mt-4 max-w-lg"
        >
          El diagnóstico es realizado personalmente por la Arq. Noelia E. Yuskowich, especialista en
          diagnóstico y mantenimiento preventivo de viviendas.
        </motion.p>
        <motion.div variants={fadeIn} className="mt-8">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="secondary" className="gap-2">
              Solicitar diagnóstico de mi vivienda
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <p className="type-body-sm text-background/40 mt-3">
            Recibí una evaluación inicial del estado de tu casa.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
