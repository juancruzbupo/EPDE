'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

const FAQS = [
  {
    q: '¿Cuánto dura el diagnóstico?',
    a: 'El relevamiento presencial lleva entre 2 y 4 horas, dependiendo del tamaño de la vivienda. El informe completo se entrega en 48-72 horas.',
  },
  {
    q: '¿Necesito estar presente durante la inspección?',
    a: 'Sí, es importante que estés durante el relevamiento para que podamos conversar sobre el historial de la vivienda y cualquier problema que hayas notado.',
  },
  {
    q: '¿El diagnóstico incluye reparaciones?',
    a: 'No. EPDE diagnostica y organiza. Si detectamos algo que requiere intervención, podés solicitar un presupuesto directamente desde la plataforma.',
  },
  {
    q: '¿Qué pasa después de los 6 meses de acceso?',
    a: 'Podés renovar la suscripción para seguir usando el sistema de seguimiento, recordatorios y actualización del ISV. El informe inicial es tuyo para siempre.',
  },
  {
    q: '¿Sirve para departamentos o solo casas?',
    a: 'Sirve para cualquier vivienda: casas, departamentos, dúplex y casas de campo. Adaptamos el diagnóstico a cada tipo de propiedad.',
  },
];

export function FaqSection({ motionProps }: SectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-3xl px-4">
        <motion.p
          variants={FADE_IN}
          className="type-label-md text-primary tracking-widest uppercase"
        >
          Preguntas frecuentes
        </motion.p>
        <motion.h2
          variants={FADE_IN_UP}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Dudas comunes antes de contratar
        </motion.h2>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div key={i} variants={STAGGER_ITEM} className="border-border rounded-xl border">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="type-body-lg text-foreground pr-4 font-medium">{faq.q}</span>
                <span
                  className="text-muted-foreground shrink-0 text-xl transition-transform"
                  style={{ transform: openIndex === i ? 'rotate(45deg)' : 'none' }}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              {openIndex === i && (
                <div className="border-border border-t px-4 pt-3 pb-4">
                  <p className="type-body-md text-muted-foreground">{faq.a}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
