import { motion } from 'framer-motion';
import { fadeIn, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';
import type { SectionProps } from '../landing-data';
import { DELIVERABLES } from '../landing-data';

export function DeliverablesSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
        <motion.p
          variants={fadeIn}
          className="type-label-md text-primary tracking-widest uppercase"
        >
          Qué incluye el diagnóstico
        </motion.p>
        <motion.h2
          variants={fadeInUp}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Todo en un mismo proceso.
        </motion.h2>

        <motion.div
          variants={fadeIn}
          className="border-border bg-card mt-10 rounded-xl border p-6 sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {DELIVERABLES.map((item) => (
              <motion.div key={item.text} variants={staggerItem} className="flex items-start gap-3">
                <div className="bg-primary/10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <item.icon className="text-primary h-3.5 w-3.5" strokeWidth={1.5} />
                </div>
                <span className="type-body-lg text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          variants={fadeIn}
          className="type-body-md text-foreground/70 mt-6 text-center italic"
        >
          Desde el día uno, tu vivienda deja de estar librada al azar.
        </motion.p>
      </motion.div>
    </section>
  );
}
