import { motion } from 'framer-motion';
import { GraduationCap, Info } from 'lucide-react';
import Image from 'next/image';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  FADE_IN,
  FADE_IN_UP,
  SLIDE_IN_LEFT,
  SLIDE_IN_RIGHT,
  STAGGER_CONTAINER,
} from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { CREDENTIALS, PATOLOGIAS_COMPETENCIAS } from '../landing-data';

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

            <p className="type-body-md text-foreground">
              Además de arquitecta, soy{' '}
              <span className="font-medium">
                Especialista en Patologías y Terapéuticas de la Construcción
              </span>
              : un posgrado enfocado en diagnosticar causas de lesiones y deterioros, diseñar
              intervenciones correctivas y prevenir fallas en obras nuevas.
            </p>

            <p className="type-body-sm text-primary/70 font-medium">
              Método afinado con los primeros clientes de Paraná y años de experiencia
              diagnosticando viviendas.
            </p>

            {/* Credenciales en jerarquía visual:
                1) Posgrado como card destacado arriba (credencial más
                   diferenciadora + acción: ⓘ abre popover con las 6
                   competencias del plan de estudios oficial).
                2) Grid 2×2 debajo con credenciales formales
                   complementarias (Colegio, muni, rep. técnica, foco). */}
            <div className="space-y-3 pt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="border-primary/20 bg-primary/5 hover:bg-primary/10 focus-visible:ring-ring flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    aria-label="Ver competencias del título de Especialista en Patologías y Terapéuticas de la Construcción"
                  >
                    <GraduationCap className="text-primary h-5 w-5 shrink-0" strokeWidth={1.5} />
                    <span className="min-w-0 flex-1">
                      <span className="type-label-md text-foreground block font-medium">
                        Especialista en Patologías y Terapéuticas de la Construcción
                      </span>
                      <span className="type-body-sm text-muted-foreground">
                        Posgrado — tocá para ver las competencias oficiales
                      </span>
                    </span>
                    <Info className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-sm" side="top">
                  <p className="type-label-md text-foreground mb-2 font-semibold">
                    Qué incluye esta especialización
                  </p>
                  <ul className="text-muted-foreground type-body-sm space-y-1.5 leading-relaxed">
                    {PATOLOGIAS_COMPETENCIAS.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>

              <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
                {CREDENTIALS.map((cred) => (
                  <div key={cred.text} className="flex items-center gap-2">
                    <cred.icon className="text-primary h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span className="type-body-sm text-foreground">{cred.text}</span>
                  </div>
                ))}
              </div>
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
