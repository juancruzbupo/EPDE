import { motion } from 'framer-motion';

import { FADE_IN, FADE_IN_UP, SCALE_IN, STAGGER_CONTAINER } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

/** SVG gauge showing an ISV score — purely illustrative. */
function IsvGauge() {
  const score = 72;
  const radius = 54;
  const circumference = Math.PI * radius; // semicircle
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-[200px] sm:w-[240px]" aria-hidden="true">
        {/* Track */}
        <path
          d="M 6 64 A 54 54 0 0 1 114 64"
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinecap="round"
          className="text-muted/40"
        />
        {/* Progress */}
        <path
          d="M 6 64 A 54 54 0 0 1 114 64"
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className="text-primary"
        />
        {/* Score */}
        <text
          x="60"
          y="56"
          textAnchor="middle"
          className="fill-foreground font-heading text-[28px]"
        >
          {score}
        </text>
        <text
          x="60"
          y="67"
          textAnchor="middle"
          className="fill-muted-foreground text-[7px] tracking-widest uppercase"
        >
          de 100
        </text>
      </svg>
      <p className="type-label-md text-primary mt-2 font-medium">Estado: Bueno</p>
    </div>
  );
}

export function IsvBlockSection({ motionProps }: SectionProps) {
  return (
    <section className="py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-4xl px-4">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
          {/* Visual */}
          <motion.div variants={SCALE_IN} className="flex shrink-0 justify-center">
            <div className="border-border bg-card rounded-2xl border p-8 shadow-sm">
              <IsvGauge />
            </div>
          </motion.div>

          {/* Copy */}
          <div>
            <motion.p
              variants={FADE_IN}
              className="type-label-md text-primary tracking-widest uppercase"
            >
              Índice de Salud
            </motion.p>
            <motion.h2
              variants={FADE_IN_UP}
              className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
            >
              El ISV: un número claro sobre el estado de tu casa.
            </motion.h2>
            <motion.p
              variants={FADE_IN}
              className="type-body-lg text-muted-foreground mt-4 max-w-lg"
            >
              El Índice de Salud de la Vivienda resume en un solo valor qué tan bien está tu casa.
              Se calcula a partir del diagnóstico profesional y se actualiza con cada intervención.
            </motion.p>
            <motion.ul
              variants={FADE_IN}
              className="type-body-md text-foreground/80 mt-4 space-y-2"
            >
              <li className="flex items-center gap-2">
                <span className="bg-success h-2 w-2 rounded-full" />
                <span>
                  <span className="font-medium">70–100:</span> Vivienda en buen estado
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-warning h-2 w-2 rounded-full" />
                <span>
                  <span className="font-medium">40–69:</span> Requiere atención preventiva
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-destructive h-2 w-2 rounded-full" />
                <span>
                  <span className="font-medium">0–39:</span> Intervención prioritaria
                </span>
              </li>
            </motion.ul>
            <motion.p variants={FADE_IN} className="type-body-md text-foreground mt-4 font-medium">
              Tu casa siempre tuvo un estado. Ahora vas a poder verlo.
            </motion.p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
