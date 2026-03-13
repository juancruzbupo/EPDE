import { motion } from 'framer-motion';
import Image from 'next/image';

import { FADE_IN, FADE_IN_UP, SCALE_IN, STAGGER_CONTAINER } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

export function DigitalSystemSection({ motionProps }: SectionProps) {
  return (
    <section className="py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            La plataforma
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Así se ve el sistema EPDE.
          </motion.h2>
        </div>

        <motion.div
          variants={SCALE_IN}
          className="mt-10 flex items-center justify-center gap-6 md:gap-10"
        >
          <div className="border-border overflow-hidden rounded-xl border shadow-sm">
            <Image
              src="/images/demo-web.png"
              alt="Panel de usuario EPDE — vista web"
              width={920}
              height={449}
              className="h-auto w-[280px] sm:w-[400px] md:w-[520px] lg:w-[600px]"
              priority
            />
          </div>
          <div className="border-border overflow-hidden rounded-2xl border shadow-sm">
            <Image
              src="/images/demo-mobile.jpg"
              alt="Panel de usuario EPDE — vista mobile"
              width={375}
              height={812}
              className="h-auto w-[100px] sm:w-[130px] md:w-[160px] lg:w-[180px]"
              priority
            />
          </div>
        </motion.div>

        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-muted-foreground mx-auto mt-8 max-w-2xl text-center"
        >
          Cada vivienda cuenta con su panel de seguimiento, historial técnico y planificación anual.
        </motion.p>

        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-foreground mx-auto mt-3 max-w-2xl text-center font-medium"
        >
          Todo el mantenimiento de tu vivienda organizado en un solo lugar.
        </motion.p>
      </motion.div>
    </section>
  );
}
