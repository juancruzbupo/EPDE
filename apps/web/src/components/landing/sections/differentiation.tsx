import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { Check, COMPARISON_ROWS } from '../landing-data';

export function DifferentiationSection({ motionProps }: SectionProps) {
  return (
    <section className="py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            La diferencia
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Forma tradicional vs. EPDE.
          </motion.h2>
        </div>

        {/* Desktop table */}
        <motion.div
          variants={FADE_IN_UP}
          className="border-border mt-10 hidden overflow-hidden rounded-xl border md:block"
        >
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="type-body-md text-foreground w-1/3 px-6 py-4 text-left font-semibold" />
                <th className="type-body-md text-muted-foreground w-1/3 px-6 py-4 text-left font-semibold">
                  Forma tradicional
                </th>
                <th className="type-body-md text-primary w-1/3 px-6 py-4 text-left font-semibold">
                  Con EPDE
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr
                  key={row.aspect}
                  className={i < COMPARISON_ROWS.length - 1 ? 'border-border border-b' : ''}
                >
                  <td className="type-body-md text-foreground px-6 py-4 font-medium">
                    {row.aspect}
                  </td>
                  <td className="type-body-md text-muted-foreground px-6 py-4">
                    {row.traditional}
                  </td>
                  <td className="type-body-md text-foreground px-6 py-4 font-medium">{row.epde}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile cards */}
        <div className="mt-10 space-y-4 md:hidden">
          {COMPARISON_ROWS.map((row) => (
            <motion.div
              key={row.aspect}
              variants={STAGGER_ITEM}
              className="border-border bg-card rounded-xl border p-5"
            >
              <h3 className="type-title-sm text-foreground">{row.aspect}</h3>
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <X className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <span className="type-body-sm text-muted-foreground">{row.traditional}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <span className="type-body-sm text-foreground font-medium">{row.epde}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
