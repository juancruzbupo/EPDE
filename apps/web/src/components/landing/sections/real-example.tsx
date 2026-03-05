import { motion } from 'framer-motion';
import { fadeIn, fadeInUp, staggerContainer } from '@/lib/motion';
import type { SectionProps } from '../landing-data';

export function RealExampleSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
        <motion.p
          variants={fadeIn}
          className="type-label-md text-primary tracking-widest uppercase"
        >
          Ejemplo real
        </motion.p>
        <motion.h2
          variants={fadeInUp}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Detectar a tiempo puede evitar reparaciones mayores.
        </motion.h2>

        <motion.p variants={fadeIn} className="type-body-lg text-muted-foreground mt-6 max-w-2xl">
          Durante un diagnóstico arquitectónico se detectó una filtración en cubierta que aún no era
          visible desde el interior de la vivienda.
        </motion.p>

        <motion.div variants={fadeInUp} className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="border-success/30 bg-success/[0.03] rounded-xl border-2 p-6">
            <p className="type-label-md text-success tracking-wide uppercase">Detección temprana</p>
            <p className="type-body-lg text-foreground mt-3">
              Reparación localizada de impermeabilización.
            </p>
            <p className="type-body-sm text-muted-foreground mt-2">
              Intervención menor sobre el sector afectado, sin necesidad de obra.
            </p>
          </div>

          <div className="border-destructive/30 bg-destructive/[0.03] rounded-xl border-2 p-6">
            <p className="type-label-md text-destructive tracking-wide uppercase">
              Si el problema avanzaba
            </p>
            <p className="type-body-lg text-foreground mt-3">
              Posible reemplazo parcial o total de cubierta.
            </p>
            <p className="type-body-sm text-muted-foreground mt-2">
              Intervención mayor con obra, afectando estructura y terminaciones interiores.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
