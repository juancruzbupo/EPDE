import { motion } from 'framer-motion';
import Image from 'next/image';

import {
  FADE_IN,
  FADE_IN_UP,
  SLIDE_IN_LEFT,
  SLIDE_IN_RIGHT,
  STAGGER_CONTAINER,
} from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { CREDENTIALS } from '../landing-data';

export function CredentialsSection({ motionProps }: SectionProps) {
  return (
    <section className="py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-3xl px-4">
        <motion.p
          variants={FADE_IN}
          className="type-label-md text-primary tracking-widest uppercase"
        >
          Quién está detrás
        </motion.p>
        <motion.h2
          variants={FADE_IN_UP}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Cada casa la analiza
          <br />
          <span className="text-muted-foreground">una arquitecta matriculada.</span>
        </motion.h2>

        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
          <motion.div
            variants={SLIDE_IN_LEFT}
            className="flex shrink-0 justify-center md:justify-start"
          >
            <Image
              src="/images/architect-placeholder.jpg"
              alt="Noelia E. Yuskowich — Arquitecta, fundadora de EPDE"
              width={128}
              height={128}
              className="rounded-2xl object-cover"
              priority
            />
          </motion.div>

          <motion.div variants={SLIDE_IN_RIGHT} className="space-y-4">
            <div>
              <p className="type-body-lg text-foreground">
                Soy <span className="font-medium">Noelia E. Yuskowich</span>, arquitecta matriculada
                (habilitada por el Colegio de Arquitectos para firmar planos e informes oficiales).
                Creé EPDE porque no existía un sistema profesional de prevención pensado para casas
                y departamentos particulares.
              </p>
              <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1">
                <span className="type-body-sm">Arquitecta</span>
                <span className="type-body-sm text-border">|</span>
                <span className="type-body-sm">Diagnóstico de viviendas</span>
                <span className="type-body-sm text-border">|</span>
                <span className="type-body-sm">Análisis de fallas y deterioros</span>
              </div>
            </div>
            <p className="type-body-md text-muted-foreground">
              Cada diagnóstico lo hago yo personalmente, adaptándolo a cada casa. Nada de listas
              genéricas.
            </p>

            <p className="type-body-sm text-primary/70 font-medium">
              Método afinado con los primeros clientes de Paraná y años de experiencia
              diagnosticando viviendas.
            </p>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
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
