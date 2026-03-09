import { motion } from 'framer-motion';
import { User } from 'lucide-react';

import { fadeIn, fadeInUp, slideInLeft, slideInRight, staggerContainer } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { CREDENTIALS } from '../landing-data';

export function CredentialsSection({ motionProps }: SectionProps) {
  return (
    <section className="py-20 md:py-28">
      <motion.div variants={staggerContainer} {...motionProps} className="mx-auto max-w-3xl px-4">
        <motion.p
          variants={fadeIn}
          className="type-label-md text-primary tracking-widest uppercase"
        >
          Quién está detrás
        </motion.p>
        <motion.h2
          variants={fadeInUp}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Criterio profesional,
          <br />
          <span className="text-muted-foreground">no un algoritmo.</span>
        </motion.h2>

        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
          <motion.div
            variants={slideInLeft}
            className="flex shrink-0 justify-center md:justify-start"
          >
            <div className="bg-primary/10 flex h-32 w-32 items-center justify-center rounded-2xl">
              <User className="text-primary/40 h-16 w-16" />
            </div>
          </motion.div>

          <motion.div variants={slideInRight} className="space-y-4">
            <div>
              <p className="type-body-lg text-foreground">
                Soy <span className="font-medium">Noelia E. Yuskowich</span>, arquitecta. Creé EPDE
                porque no existía un sistema profesional de prevención para viviendas unifamiliares.
              </p>
              <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1">
                <span className="type-body-sm">Arquitecta</span>
                <span className="type-body-sm text-border">|</span>
                <span className="type-body-sm">Diagnóstico edilicio</span>
                <span className="type-body-sm text-border">|</span>
                <span className="type-body-sm">Evaluación de patologías constructivas</span>
              </div>
            </div>
            <p className="type-body-md text-muted-foreground">
              Durante años vi cómo pequeños problemas se convertían en intervenciones mayores por
              falta de planificación. EPDE nace para cambiar eso.
            </p>
            <p className="type-body-md text-muted-foreground">
              Cada diagnóstico lo realizo personalmente. No uso checklists genéricos: evalúo con
              criterio arquitectónico, adaptado a cada vivienda.
            </p>

            <p className="type-body-sm text-primary/70 font-medium">
              Sistema desarrollado a partir de años de experiencia en diagnóstico edilicio y
              validado con propietarios reales en Paraná.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {CREDENTIALS.map((cred) => (
                <div key={cred.text} className="flex items-center gap-2">
                  <cred.icon className="text-primary h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="type-body-sm text-foreground">{cred.text}</span>
                </div>
              ))}
            </div>

            <p className="text-foreground/80 type-body-md pt-2 italic">
              &ldquo;Una vivienda no solo se construye. Se cuida con sistema.&rdquo;
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
