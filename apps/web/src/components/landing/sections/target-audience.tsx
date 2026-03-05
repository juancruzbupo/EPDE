import { motion } from 'framer-motion';
import { fadeIn, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';
import type { SectionProps } from '../landing-data';
import { Check, TARGET_PROFILES } from '../landing-data';

export function TargetAudienceSection({ motionProps }: SectionProps) {
  return (
    <section className="py-20 md:py-28">
      <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
        <motion.h2
          variants={fadeInUp}
          className="font-heading text-foreground text-3xl tracking-tight sm:text-4xl"
        >
          Para quiénes es este servicio
        </motion.h2>

        <div className="mt-8 space-y-4">
          {TARGET_PROFILES.map((profile) => (
            <motion.div key={profile} variants={staggerItem} className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <Check className="text-primary h-3.5 w-3.5" />
              </div>
              <span className="type-body-lg text-foreground">{profile}</span>
            </motion.div>
          ))}
        </div>

        <motion.p variants={fadeIn} className="type-body-md text-foreground mt-6 font-medium">
          Personas que entienden que prevenir es una decisión inteligente.
        </motion.p>

        <motion.p variants={fadeIn} className="type-body-md text-muted-foreground mt-4">
          No es para resolver una gotera puntual ni para casas en alquiler temporario. Es un sistema
          de prevención para quienes cuidan su patrimonio con visión de largo plazo.
        </motion.p>
      </motion.div>
    </section>
  );
}
