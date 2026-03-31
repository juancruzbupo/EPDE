import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';
import { DIAGNOSIS_INCLUDES, WHATSAPP_URL } from '../landing-data';

export function DeliverablesSection({ motionProps }: SectionProps) {
  return (
    <section id="que-incluye" className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-3xl px-4">
        <motion.p
          variants={FADE_IN}
          className="type-label-md text-primary tracking-widest uppercase"
        >
          Qué incluye
        </motion.p>
        <motion.h2
          variants={FADE_IN_UP}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Qué incluye el Diagnóstico EPDE.
        </motion.h2>

        <motion.div
          variants={FADE_IN}
          className="border-border bg-card mt-10 rounded-xl border p-6 sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {DIAGNOSIS_INCLUDES.map((item) => (
              <motion.div
                key={item.text}
                variants={STAGGER_ITEM}
                className="flex items-start gap-3"
              >
                <div className="bg-primary/10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  <item.icon className="text-primary h-3.5 w-3.5" strokeWidth={1.5} />
                </div>
                <span className="type-body-lg text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main deliverables callout */}
        <motion.p
          variants={FADE_IN}
          className="type-body-md text-primary mt-6 text-center font-medium"
        >
          Los dos pilares del diagnóstico: tu ISV (un número claro) + tu plan de mantenimiento (qué
          hacer y cuándo).
        </motion.p>

        <motion.div
          variants={FADE_IN}
          className="border-primary/20 bg-primary/[0.03] mt-6 rounded-xl border p-6 sm:p-8"
        >
          <p className="type-body-lg text-foreground font-medium">
            Si detectamos algo crítico, podés solicitar el servicio directamente desde la
            plataforma.
          </p>
          <p className="type-body-md text-muted-foreground mt-2">
            Servicios profesionales, presupuestos e intervenciones específicas se cotizan aparte.
          </p>
          <div className="mt-4">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                Consultar sobre intervenciones
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.p
          variants={FADE_IN}
          className="type-body-md text-foreground/70 mt-6 text-center italic"
        >
          Desde el día uno, tu vivienda deja de estar librada al azar.
        </motion.p>
      </motion.div>
    </section>
  );
}
