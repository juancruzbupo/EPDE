import { motion } from 'framer-motion';

import { fadeIn, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { AlertTriangle, Shield } from '../landing-data';

const URGENCY_POINTS = [
  {
    icon: AlertTriangle,
    title: 'Los problemas graves empiezan como fallas pequeñas',
    description:
      'Una micro-fisura, una mancha de humedad, un cable recalentado. Señales que pasan desapercibidas y que, sin intervención, escalan en meses.',
  },
  {
    icon: Shield,
    title: 'Detectarlas a tiempo puede evitar reparaciones mucho más costosas',
    description:
      'La diferencia entre una intervención preventiva de $150.000 y una reparación de emergencia de $5.000.000 es, simplemente, haberlo detectado antes.',
  },
];

export function UrgencySection({ motionProps }: SectionProps) {
  return (
    <section className="py-20 md:py-28">
      <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-foreground text-3xl tracking-tight sm:text-4xl"
          >
            ¿Podés esperar?
          </motion.h2>
          <motion.p
            variants={fadeIn}
            className="type-body-lg text-muted-foreground mx-auto mt-4 max-w-2xl"
          >
            La mayoría de los propietarios postergan el mantenimiento hasta que el problema se
            vuelve urgente. Para ese momento, la solución ya es otra.
          </motion.p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {URGENCY_POINTS.map((point) => (
            <motion.div
              key={point.title}
              variants={staggerItem}
              className="border-border bg-card rounded-xl border p-6"
            >
              <div className="bg-warning/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <point.icon className="text-warning h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="type-title-md text-foreground mt-4">{point.title}</h3>
              <p className="type-body-md text-muted-foreground mt-2">{point.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          variants={fadeIn}
          className="type-body-lg text-foreground mx-auto mt-10 max-w-2xl text-center font-medium"
        >
          No es alarmismo. Es lo que vemos en cada vivienda que evaluamos.
        </motion.p>
      </motion.div>
    </section>
  );
}
