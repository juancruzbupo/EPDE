import { motion } from 'framer-motion';
import { MonitorSmartphone, Play } from 'lucide-react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

export function DemoSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Así se ve por dentro
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Tu casa, organizada en un solo lugar.
          </motion.h2>
          <motion.p
            variants={FADE_IN}
            className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
          >
            El sistema EPDE te muestra el estado de tu vivienda, las tareas pendientes y te avisa
            cuándo actuar.
          </motion.p>
        </div>

        {/* Video placeholder */}
        <motion.div variants={FADE_IN_UP} className="mt-12">
          <div className="border-border bg-card mx-auto aspect-video max-w-3xl overflow-hidden rounded-2xl border shadow-lg">
            {/* Replace this div with a real video: <video> or YouTube embed */}
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#a65636]/5 to-[#a65636]/10">
              <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                <Play className="text-primary h-7 w-7" fill="currentColor" />
              </div>
              <p className="type-body-md text-muted-foreground font-medium">
                Video de demostración
              </p>
              <p className="type-body-sm text-muted-foreground/70 max-w-sm text-center">
                Noelia mostrando cómo funciona el sistema con una vivienda real — 60 segundos
              </p>
            </div>
          </div>
        </motion.div>

        {/* Feature highlights below video */}
        <motion.div
          variants={FADE_IN}
          className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            { label: 'Dashboard de salud', desc: 'Puntaje ISV de tu vivienda' },
            { label: 'Tareas programadas', desc: 'Qué hacer y cuándo hacerlo' },
            { label: 'Alertas automáticas', desc: 'Notificaciones en tu celular' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-xl p-3">
              <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <MonitorSmartphone className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="type-body-md text-foreground font-medium">{item.label}</p>
                <p className="type-body-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
