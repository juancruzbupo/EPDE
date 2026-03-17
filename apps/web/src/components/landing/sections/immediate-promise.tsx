import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

const PROMISES = [
  'Qué problemas tiene tu casa',
  'Qué tan graves son',
  'Cuánto te pueden costar si no se atienden',
];

export function ImmediatePromiseSection({ motionProps }: SectionProps) {
  return (
    <section className="py-16 md:py-20">
      <motion.div
        variants={STAGGER_CONTAINER}
        {...motionProps}
        className="mx-auto max-w-3xl px-4 text-center"
      >
        <motion.h2
          variants={FADE_IN_UP}
          className="font-heading text-foreground text-2xl tracking-tight sm:text-3xl"
        >
          En una sola visita vas a saber:
        </motion.h2>
        <div className="mt-8 inline-flex flex-col gap-4 text-left">
          {PROMISES.map((promise) => (
            <motion.div key={promise} variants={STAGGER_ITEM} className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <Check className="text-primary h-3.5 w-3.5" />
              </div>
              <span className="type-body-lg text-foreground">{promise}</span>
            </motion.div>
          ))}
        </div>
        <motion.p
          variants={FADE_IN}
          className="type-body-md text-muted-foreground mx-auto mt-6 max-w-lg"
        >
          Solo 10 diagnósticos disponibles este mes en Paraná.
        </motion.p>
      </motion.div>
    </section>
  );
}
