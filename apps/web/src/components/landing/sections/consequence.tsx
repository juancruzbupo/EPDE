import { motion } from 'framer-motion';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';
import type { LandingConsequenceExample } from '@/types/landing-settings';

import type { SectionProps } from '../landing-data';
import { CONSEQUENCE_EXAMPLES, COST_DISCLAIMER } from '../landing-data';

interface ConsequenceSectionProps extends SectionProps {
  consequences?: LandingConsequenceExample[];
  costDisclaimer?: string;
}

export function ConsequenceSection({
  motionProps,
  consequences,
  costDisclaimer,
}: ConsequenceSectionProps) {
  const examples = consequences ?? CONSEQUENCE_EXAMPLES;
  const disclaimer = costDisclaimer ?? COST_DISCLAIMER;
  return (
    <section className="py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-destructive tracking-widest uppercase"
          >
            Por qué prevenir
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Detectar tarde siempre sale más caro.
          </motion.h2>
        </div>

        <div className="mt-10 space-y-4">
          {examples.map((example) => (
            <motion.div
              key={example.problem}
              variants={STAGGER_ITEM}
              className="border-border bg-card rounded-xl border p-5"
            >
              <h3 className="type-title-md text-foreground">{example.problem}</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="bg-success/5 rounded-lg px-3 py-2">
                  <p className="type-body-sm text-muted-foreground">Detectado a tiempo</p>
                  <p className="type-body-md text-success font-semibold">{example.preventive}</p>
                </div>
                <div className="bg-destructive/5 rounded-lg px-3 py-2">
                  <p className="type-body-sm text-muted-foreground">Sin prevención</p>
                  <p className="type-body-md text-destructive font-semibold">{example.emergency}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-muted-foreground/70 mx-auto mt-6 max-w-3xl text-center"
        >
          {disclaimer}
        </motion.p>
      </motion.div>
    </section>
  );
}
