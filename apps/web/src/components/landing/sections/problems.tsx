import { motion } from 'framer-motion';
import { fadeIn, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';
import type { SectionProps } from '../landing-data';
import { PROBLEMS, REPAIR_COSTS, COST_DISCLAIMER } from '../landing-data';

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

      {/* Costos de reparación si no se previene */}
      <section className="py-20 md:py-28">
        <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-4xl px-4">
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground text-3xl tracking-tight sm:text-4xl"
          >
            ¿Cuánto cuesta no prevenir?
          </motion.h2>
          <motion.p variants={fadeIn} className="type-body-lg text-muted-foreground mt-4 max-w-2xl">
            Estos son los costos estimados de reparación cuando los problemas no se detectan a
            tiempo.
          </motion.p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {REPAIR_COSTS.map((item) => (
              <motion.div
                key={item.problem}
                variants={staggerItem}
                className="border-border bg-card rounded-xl border p-6"
              >
                <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <item.icon className="text-destructive h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="type-title-md text-foreground mt-4">{item.problem}</h3>
                <p className="type-body-md text-muted-foreground mt-2">{item.consequence}</p>
                <div className="bg-destructive/5 mt-4 rounded-lg px-3 py-2">
                  <p className="type-body-sm text-muted-foreground">
                    Costo estimado de reparación:
                  </p>
                  <p className="type-body-lg text-destructive font-semibold">{item.repairRange}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            variants={fadeIn}
            className="type-body-md text-foreground/70 mx-auto mt-8 max-w-2xl text-center font-medium"
          >
            Detectar estos problemas a tiempo mediante mantenimiento preventivo puede reducir
            significativamente el costo de la solución.
          </motion.p>

          <motion.p
            variants={fadeIn}
            className="type-body-sm text-muted-foreground/70 mx-auto mt-4 max-w-3xl text-center"
          >
            {COST_DISCLAIMER}
          </motion.p>
        </motion.div>
      </section>
    </>
  );
}
