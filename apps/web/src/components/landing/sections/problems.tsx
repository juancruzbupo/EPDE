import { motion } from 'framer-motion';
import { fadeIn, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';
import type { SectionProps } from '../landing-data';
import { PROBLEMS, DETECTED_PROBLEMS } from '../landing-data';

export function ProblemsSection({ motionProps }: SectionProps) {
  return (
    <>
      {/* Problema */}
      <section className="bg-muted/30 py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-5xl px-4">
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground text-3xl tracking-tight sm:text-4xl"
          >
            El problema no es el paso del tiempo.
            <br />
            <span className="text-muted-foreground">Es no tener sistema.</span>
          </motion.h2>
          <motion.div
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mt-4 max-w-2xl space-y-4"
          >
            <p>
              Las filtraciones no empiezan siendo urgencias. Las instalaciones no fallan de un día
              para el otro. El deterioro es progresivo, invisible y acumulativo.
            </p>
            <p>
              Cada mes que pasa sin revisión, el costo de la solución crece. Lo que hoy se resuelve
              con una intervención menor, mañana requiere obra completa.
            </p>
            <p>Postergar no es ahorrar. Es acumular riesgo.</p>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <motion.div
                key={problem.title}
                variants={staggerItem}
                className="border-border bg-card rounded-xl border p-6"
              >
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                  <problem.icon className="text-foreground/60 h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="type-title-md text-foreground mt-4">{problem.title}</h3>
                <p className="type-body-md text-muted-foreground mt-2">{problem.description}</p>
                <p className="type-body-sm text-foreground/70 mt-3 font-medium">
                  {problem.consequence}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-10 max-w-2xl text-center"
          >
            La diferencia entre preservar tu vivienda y enfrentar una reparación mayor es, casi
            siempre, <span className="text-foreground font-medium">haber actuado a tiempo.</span>
          </motion.p>
        </motion.div>
      </section>

      {/* Problemas detectados */}
      <section className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground text-3xl tracking-tight sm:text-4xl"
          >
            Problemas que detectamos antes de que se conviertan en reparaciones costosas
          </motion.h2>

          <motion.div
            variants={fadeIn}
            className="border-border bg-card mt-10 rounded-xl border p-6 sm:p-8"
          >
            <div className="space-y-4">
              {DETECTED_PROBLEMS.map((item) => (
                <motion.div
                  key={item.text}
                  variants={staggerItem}
                  className="flex items-center gap-3"
                >
                  <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                    <item.icon className="text-primary h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <span className="type-body-lg text-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-8 max-w-2xl text-center"
          >
            Pequeños problemas que con el tiempo pueden transformarse en reparaciones costosas si no
            se detectan a tiempo.
          </motion.p>
        </motion.div>
      </section>
    </>
  );
}
