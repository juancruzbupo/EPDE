import { motion } from 'framer-motion';
import { fadeIn, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';
import type { SectionProps } from '../landing-data';
import { COST_COMPARISONS, COST_DISCLAIMER } from '../landing-data';

export function CostComparisonSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground text-3xl tracking-tight sm:text-4xl"
          >
            Prevenir siempre cuesta menos que reparar.
          </motion.h2>
          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
          >
            Comparación entre el costo de una intervención preventiva a tiempo y el costo de una
            reparación de emergencia.
          </motion.p>
        </div>

        {/* Desktop table */}
        <motion.div
          variants={fadeInUp}
          className="border-border mt-10 hidden overflow-hidden rounded-xl border md:block"
        >
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="type-body-md text-foreground px-6 py-4 text-left font-semibold">
                  Problema
                </th>
                <th className="type-body-md text-success px-6 py-4 text-left font-semibold">
                  Prevención
                </th>
                <th className="type-body-md text-destructive px-6 py-4 text-left font-semibold">
                  Reparación de emergencia
                </th>
                <th className="type-body-md text-foreground px-6 py-4 text-center font-semibold">
                  Diferencia
                </th>
              </tr>
            </thead>
            <tbody>
              {COST_COMPARISONS.map((row, i) => (
                <tr
                  key={row.pathology}
                  className={i < COST_COMPARISONS.length - 1 ? 'border-border border-b' : ''}
                >
                  <td className="type-body-md text-foreground px-6 py-4 font-medium">
                    {row.pathology}
                  </td>
                  <td className="type-body-md text-success px-6 py-4 font-medium">
                    {row.preventive}
                  </td>
                  <td className="type-body-md text-destructive px-6 py-4 font-medium">
                    {row.emergency}
                  </td>
                  <td className="type-body-md text-foreground px-6 py-4 text-center font-bold">
                    {row.multiplier}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile cards */}
        <div className="mt-10 space-y-4 md:hidden">
          {COST_COMPARISONS.map((row) => (
            <motion.div
              key={row.pathology}
              variants={staggerItem}
              className="border-border bg-card rounded-xl border p-5"
            >
              <h3 className="type-title-md text-foreground">{row.pathology}</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="bg-success/5 rounded-lg px-3 py-2">
                  <p className="type-body-sm text-muted-foreground">Prevención</p>
                  <p className="type-body-md text-success font-semibold">{row.preventive}</p>
                </div>
                <div className="bg-destructive/5 rounded-lg px-3 py-2">
                  <p className="type-body-sm text-muted-foreground">Emergencia</p>
                  <p className="type-body-md text-destructive font-semibold">{row.emergency}</p>
                </div>
              </div>
              <p className="type-body-sm text-foreground mt-2 text-center font-bold">
                Hasta {row.multiplier} más caro
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={fadeIn}
          className="type-body-sm text-muted-foreground/70 mx-auto mt-8 max-w-3xl text-center"
        >
          {COST_DISCLAIMER}
        </motion.p>
      </motion.div>
    </section>
  );
}
