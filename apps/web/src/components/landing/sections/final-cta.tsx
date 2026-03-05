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
        <motion.div
          variants={fadeIn}
          className="type-body-lg text-background/60 mx-auto mt-6 max-w-md space-y-1"
        >
          <p>Diagnóstico personalizado.</p>
          <p>Plan preventivo.</p>
          <p>Seguimiento digital.</p>
        </motion.div>
        <motion.p variants={fadeIn} className="type-body-lg text-background/80 mt-4 font-medium">
          Todo empieza con una consulta.
        </motion.p>
        <motion.div variants={fadeIn} className="mt-8">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="secondary" className="gap-2">
              Quiero coordinar mi diagnóstico
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
