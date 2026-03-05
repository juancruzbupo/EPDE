import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fadeIn, fadeInUp, staggerContainer } from '@/lib/motion';
import type { SectionProps } from '../landing-data';
import { Check, INVESTMENT_FEATURES, WHATSAPP_URL } from '../landing-data';

export function InvestmentSection({ motionProps }: SectionProps) {
  return (
    <section id="inversion" className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
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
            El valor se adapta a cada vivienda.
          </motion.h2>
        </div>

        <motion.div
          variants={fadeIn}
          className="type-body-lg text-muted-foreground mx-auto mt-6 max-w-2xl space-y-4 text-center"
        >
          <p>
            La mayoría de los propietarios descubre los problemas cuando ya se transformaron en
            reparaciones importantes.
          </p>
          <p>Un diagnóstico preventivo permite detectarlos antes de que escalen.</p>
        </motion.div>

        <motion.p
          variants={fadeIn}
          className="type-body-md text-muted-foreground mx-auto mt-2 max-w-2xl text-center"
        >
          El alcance del diagnóstico depende de la superficie y complejidad técnica de la vivienda.
          Por eso el valor se determina de forma personalizada.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="border-primary/20 bg-primary/[0.03] mt-10 rounded-2xl border-2 p-8 sm:p-12"
        >
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

          <div className="border-border mt-8 border-t pt-8 text-center">
            <p className="type-body-md text-foreground/80">
              Cupos de lanzamiento limitados para viviendas en Paraná.
            </p>
            <p className="type-body-sm text-muted-foreground mt-2">
              Consultá sin compromiso. Te confirmamos disponibilidad y valor según tu vivienda.
            </p>
          </div>

          <div className="mt-8 text-center">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                Coordinar mi diagnóstico
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
