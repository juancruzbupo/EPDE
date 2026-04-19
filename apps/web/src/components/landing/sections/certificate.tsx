import { motion } from 'framer-motion';
import { FileCheck, ShieldCheck, TrendingUp } from 'lucide-react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Demostrás que la cuidaste',
    description:
      'Es una prueba en papel de que tu casa estuvo mantenida profesionalmente, no abandonada.',
  },
  {
    icon: TrendingUp,
    title: 'Te ayuda a vender mejor',
    description:
      'Funciona como el historial de service de un auto: suma confianza al comprador y te ayuda a defender el precio.',
  },
  {
    icon: FileCheck,
    title: 'Historial documentado',
    description:
      'Registro útil ante inmobiliarias y compradores para mostrar el estado real de tu casa con contexto.',
  },
];

export function CertificateSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-5xl px-4">
        <motion.p
          variants={FADE_IN}
          className="type-label-md text-primary tracking-widest uppercase"
        >
          Certificado de Mantenimiento Preventivo
        </motion.p>
        <motion.h2
          variants={FADE_IN_UP}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Tu casa mantenida,
          <br />
          <span className="text-muted-foreground">con historial documentado.</span>
        </motion.h2>
        <motion.p
          variants={FADE_IN_UP}
          className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed"
        >
          Después de 1 año de mantenimiento continuo, y con un puntaje ISV mayor a 60, te emitimos
          una constancia firmada por la arquitecta. Es un registro profesional del cuidado que le
          diste a tu casa a lo largo del tiempo.
        </motion.p>

        <motion.div variants={FADE_IN_UP} className="mt-10 grid gap-5 sm:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="border-border bg-card rounded-xl border p-5">
              <benefit.icon className="text-primary mb-3 h-6 w-6" aria-hidden="true" />
              <h3 className="font-heading text-foreground mb-1.5 text-lg">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          variants={FADE_IN}
          className="border-border/60 bg-background/60 mt-8 rounded-lg border-l-2 p-4 text-sm"
        >
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Para ser claros:</strong> este certificado es un
            documento privado. <strong>No reemplaza</strong> los certificados oficiales que pide un
            banco para crédito hipotecario, una aseguradora para el seguro de hogar o una escribanía
            al momento de la compraventa. Sirve como respaldo adicional — como el historial de
            service de un auto.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
