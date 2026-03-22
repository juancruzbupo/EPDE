import { motion } from 'framer-motion';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { MARKET_PROBLEMS } from '../landing-data';

export function ProblemsSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            El problema
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Tu casa se deteriora sin que lo notes.
          </motion.h2>
          <motion.p
            variants={FADE_IN}
            className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
          >
            La mayoría de las viviendas no tienen mantenimiento preventivo. El deterioro es
            progresivo, invisible y acumulativo. Cuando aparece el problema, ya es otro presupuesto.
          </motion.p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MARKET_PROBLEMS.map((problem) => (
            <motion.div
              key={problem.title}
              variants={STAGGER_ITEM}
              className="border-border bg-card rounded-xl border p-6"
            >
              <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <problem.icon className="text-destructive h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="type-title-md text-foreground mt-4">{problem.title}</h3>
              <p className="type-body-md text-muted-foreground mt-2">{problem.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-foreground mx-auto mt-10 max-w-2xl text-center font-medium"
        >
          Cada mes sin revisión, el costo de la solución crece.
        </motion.p>
      </motion.div>
    </section>
  );
}
