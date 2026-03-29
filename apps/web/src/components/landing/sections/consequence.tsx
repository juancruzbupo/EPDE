import { motion } from 'framer-motion';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { CONSEQUENCE_EXAMPLES, COST_DISCLAIMER } from '../landing-data';

export function ConsequenceSection({ motionProps }: SectionProps) {
  return (
    <section className="py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-destructive tracking-widest uppercase"
          >
            La consecuencia
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Detectar tarde siempre sale más caro.
          </motion.h2>
          <motion.p
            variants={FADE_IN}
            className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
          >
            Una filtración no detectada puede convertirse en un problema mucho más caro. Estos son
            ejemplos reales de la diferencia entre actuar a tiempo y no hacerlo.
          </motion.p>
        </div>

        <div className="mt-10 space-y-4">
          {CONSEQUENCE_EXAMPLES.map((example) => (
            <motion.div
              key={example.problem}
              variants={STAGGER_ITEM}
              className="border-border bg-card rounded-xl border p-5"
            >
              <h3 className="type-title-md text-foreground">{example.problem}</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
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

        {/* Inaction consequences */}
        <motion.div
          variants={FADE_IN}
          className="border-destructive/20 bg-destructive/[0.03] mx-auto mt-10 max-w-lg rounded-xl border p-6"
        >
          <p className="type-body-md text-foreground font-medium">
            Si no hacés mantenimiento preventivo:
          </p>
          <ul className="type-body-sm text-muted-foreground mt-3 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              Los problemas aparecen tarde, cuando ya son caros
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              Los costos aumentan con cada mes sin revisión
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              Terminás reaccionando en lugar de prevenir
            </li>
          </ul>
        </motion.div>

        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-foreground mx-auto mt-8 max-w-2xl text-center font-medium"
        >
          Por $35.000 de diagnóstico, podés evitar reparaciones de millones. EPDE existe para que
          estos números no te toquen a vos.
        </motion.p>

        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-muted-foreground/70 mx-auto mt-4 max-w-3xl text-center"
        >
          {COST_DISCLAIMER}
        </motion.p>
      </motion.div>
    </section>
  );
}
