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
          Ejemplo de detección temprana
        </motion.p>
        <motion.h2
          variants={fadeInUp}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Filtración incipiente en techo detectada en una revisión preventiva.
        </motion.h2>

        <motion.p variants={fadeIn} className="type-body-lg text-muted-foreground mt-6 max-w-2xl">
          En una inspección preventiva de rutina se detecta una filtración inicial en la cubierta
          que aún no presenta síntomas visibles en el interior. Sin intervención, el agua avanza
          hacia la estructura, daña el cielorraso y genera humedad en muros.
        </motion.p>

        <motion.div variants={fadeInUp} className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="border-success/30 bg-success/[0.03] rounded-xl border-2 p-6">
            <p className="type-label-md text-success tracking-wide uppercase">
              Reparación preventiva temprana
            </p>
            <p className="type-body-lg text-foreground mt-3">
              Sellado localizado de la zona afectada.
            </p>
            <p className="type-body-sm text-muted-foreground mt-2">
              Intervención menor sobre el sector de cubierta, sin necesidad de obra ni afectación
              interior.
            </p>
            <p className="type-body-lg text-success mt-4 font-semibold">$150.000 – $400.000</p>
          </div>

          <div className="border-destructive/30 bg-destructive/[0.03] rounded-xl border-2 p-6">
            <p className="type-label-md text-destructive tracking-wide uppercase">
              Reparación estructural avanzada
            </p>
            <p className="type-body-lg text-foreground mt-3">
              Reemplazo parcial de cubierta, reparación de cielorraso y tratamiento de humedad.
            </p>
            <p className="type-body-sm text-muted-foreground mt-2">
              Intervención mayor con obra, afectando estructura, aislación y terminaciones
              interiores.
            </p>
            <p className="type-body-lg text-destructive mt-4 font-semibold">
              $2.500.000 – $6.000.000
            </p>
          </div>
        </motion.div>

        <motion.p
          variants={fadeIn}
          className="type-body-sm text-muted-foreground/70 mx-auto mt-6 max-w-2xl text-center"
        >
          Ejemplo ilustrativo basado en escenarios típicos. Los costos son estimaciones de mercado y
          pueden variar según cada caso.
        </motion.p>
      </motion.div>
    </section>
  );
}
