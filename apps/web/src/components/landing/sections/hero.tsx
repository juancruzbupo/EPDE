import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fadeIn, fadeInUp, staggerContainer } from '@/lib/motion';
import type { SectionProps } from '../landing-data';
import { WHATSAPP_URL } from '../landing-data';

export function HeroSection({ motionProps }: SectionProps) {
  return (
    <section className="pt-32 pb-20 md:pt-44 md:pb-28">
      <motion.div
        variants={staggerContainer}
        {...motionProps}
        className="mx-auto max-w-5xl px-4 text-center"
      >
        <motion.h1
          variants={fadeInUp}
          className="font-heading text-foreground text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          El mantenimiento preventivo que evita
          <br />
          <span className="text-primary">problemas costosos en tu casa.</span>
        </motion.h1>

        <motion.p
          variants={fadeIn}
          className="type-body-md text-muted-foreground/80 mx-auto mt-5 max-w-2xl"
        >
          Después de 5 a 10 años sin mantenimiento planificado, la mayoría de las viviendas acumulan
          problemas que no se ven a simple vista.
        </motion.p>

        <motion.p
          variants={fadeIn}
          className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
        >
          Detectamos y solucionamos a tiempo filtraciones, humedad, problemas eléctricos y fallas
          comunes del hogar antes de que se conviertan en reparaciones caras.
        </motion.p>

        <motion.div variants={fadeIn} className="mt-10 flex justify-center">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="gap-2">
              Evaluar mi vivienda
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
