import { motion } from 'framer-motion';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { SOLUTION_POINTS } from '../landing-data';

export function SolutionSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            La solución
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            EPDE: diagnóstico + sistema + prevención.
          </motion.h2>
          <motion.p
            variants={FADE_IN}
            className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
          >
            No es un servicio de reparación. Es un sistema profesional que te muestra el estado real
            de tu vivienda y te ayuda a mantenerla bajo control.
          </motion.p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {SOLUTION_POINTS.map((point) => (
            <motion.div
              key={point.text}
              variants={STAGGER_ITEM}
              className="border-border bg-card rounded-xl border p-6"
            >
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <point.icon className="text-primary h-5 w-5" strokeWidth={1.5} />
              </div>
              <p className="type-body-lg text-foreground mt-4 font-medium">{point.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-foreground mx-auto mt-10 max-w-2xl text-center font-medium"
        >
          Un solo diagnóstico te da visibilidad completa sobre tu vivienda.
        </motion.p>
      </motion.div>
    </section>
  );
}
