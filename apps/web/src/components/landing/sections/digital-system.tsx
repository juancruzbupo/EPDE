import { motion } from 'framer-motion';
import Image from 'next/image';

import { FADE_IN, FADE_IN_UP, SCALE_IN, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { SYSTEM_FEATURES } from '../landing-data';

export function DigitalSystemSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            El sistema
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Esto no es solo un informe.
            <br />
            <span className="text-muted-foreground">Es un sistema con seguimiento.</span>
          </motion.h2>
          <motion.p
            variants={FADE_IN}
            className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
          >
            El diagnóstico incluye acceso a la plataforma EPDE, donde tu vivienda tiene su propio
            panel de seguimiento, historial y alertas automáticas.
          </motion.p>
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

        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {SYSTEM_FEATURES.map((feature) => (
            <motion.div
              key={feature.text}
              variants={STAGGER_ITEM}
              className="flex items-center gap-3"
            >
              <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                <feature.icon className="text-primary h-3.5 w-3.5" strokeWidth={1.5} />
              </div>
              <span className="type-body-md text-foreground">{feature.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={FADE_IN}
          className="type-body-lg text-foreground mx-auto mt-8 max-w-2xl text-center font-medium"
        >
          Todo el mantenimiento de tu vivienda organizado en un solo lugar.
        </motion.p>
      </motion.div>
    </section>
  );
}
