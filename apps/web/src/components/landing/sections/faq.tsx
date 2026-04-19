'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';
import type { LandingFaqItem } from '@/types/landing-settings';

import type { SectionProps } from '../landing-data';

const FAQS = [
  {
    q: '¿Cuánto dura la visita?',
    a: 'Entre 2 y 4 horas según la casa. El informe completo lo recibís en 48 a 72 horas.',
  },
  {
    q: '¿Tengo que estar presente durante la visita?',
    a: 'Sí, para que puedas contarnos el estado real de tu casa y resolver dudas en el momento.',
  },
  {
    q: '¿Incluye reparaciones?',
    a: 'No. EPDE diagnostica y organiza todo, pero las reparaciones se cotizan aparte y las podés contratar por otro lado o a través de la plataforma.',
  },
  {
    q: '¿Qué pasa después de los 6 meses de acceso?',
    a: 'Podés seguir con un plan mensual opcional para continuar con el seguimiento. El informe inicial queda tuyo para siempre, aunque no renueves.',
  },
  {
    q: '¿Sirve para departamentos?',
    a: 'Sí. Sirve para casas, departamentos, dúplex y casas de campo. Adaptamos el diagnóstico a cada tipo de propiedad.',
  },
];

interface FaqSectionProps extends SectionProps {
  faq?: LandingFaqItem[];
}

export function FaqSection({ motionProps, faq }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = Array.isArray(faq)
    ? faq.map((item) => ({ q: item.question, a: item.answer }))
    : FAQS;

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
          {items.map((faqItem, i) => {
            const panelId = `faq-answer-${i}`;
            const buttonId = `faq-trigger-${i}`;
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                variants={STAGGER_ITEM}
                className="border-border rounded-xl border"
              >
                <button
                  id={buttonId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="type-body-lg text-foreground pr-4 font-medium">{faqItem.q}</span>
                  <span
                    className="text-muted-foreground shrink-0 text-xl transition-transform"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="border-border border-t px-4 pt-3 pb-4"
                  >
                    <p className="type-body-md text-muted-foreground">{faqItem.a}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
