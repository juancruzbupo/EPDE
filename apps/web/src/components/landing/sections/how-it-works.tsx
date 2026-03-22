import { motion } from 'framer-motion';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { STEPS } from '../landing-data';

export function HowItWorksSection({ motionProps }: SectionProps) {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Cómo funciona
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Tres pasos. Un sistema completo.
          </motion.h2>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step) => (
            <motion.div key={step.number} variants={STAGGER_ITEM}>
              <span className="font-heading text-primary/20 text-5xl">{step.number}</span>
              <div className="mt-2 flex items-center gap-3">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <step.icon className="text-primary h-4 w-4" strokeWidth={1.5} />
                </div>
                <h3 className="type-title-md text-foreground">{step.title}</h3>
              </div>
              <p className="type-body-md text-muted-foreground mt-3">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
