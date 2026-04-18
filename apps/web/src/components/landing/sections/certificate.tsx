import { motion } from 'framer-motion';
import { FileCheck, ShieldCheck, TrendingUp } from 'lucide-react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Demostrá cuidado',
    description:
      'Evidencia tangible de que tu vivienda está mantenida profesionalmente, no abandonada.',
  },
  {
    icon: TrendingUp,
    title: 'Argumento de venta',
    description:
      'Funciona como historial de servicio de un auto: suma confianza al comprador y justifica precio.',
  },
  {
    icon: FileCheck,
    title: 'Respaldo documental',
    description:
      'Útil ante inmobiliarias, tasadores y compradores para respaldar el estado declarado de la vivienda.',
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
          <span className="text-muted-foreground">con respaldo documental.</span>
        </motion.h2>
        <motion.p
          variants={FADE_IN_UP}
          className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed"
        >
          Después de 1 año de mantenimiento continuo y con un Índice de Salud (ISV) mayor a 60,
          emitimos un certificado firmado por la arquitecta responsable. Es la prueba tangible de
          que tu vivienda recibe cuidado profesional sostenido en el tiempo.
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
            <strong className="text-foreground">Aclaración honesta:</strong> es un documento
            privado. <strong>No reemplaza</strong> los certificados oficiales que pide un banco para
            crédito hipotecario, una aseguradora para póliza de hogar, o una escribanía en la
            compraventa. Sirve como respaldo complementario — como el historial de un auto.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
