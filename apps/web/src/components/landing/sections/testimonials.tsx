import { motion } from 'framer-motion';
import { Clock, Star, User } from 'lucide-react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

interface Testimonial {
  name: string;
  neighborhood: string;
  quote: string;
  propertyType: string;
}

/**
 * Testimonios reales. Vacío mientras no haya al menos 3 clientes con
 * experiencia completa: mostrar placeholders "Nombre del cliente" destruye
 * credibilidad más de lo que suma. Cuando haya datos, cargarlos acá y se
 * renderiza la grilla automáticamente.
 */
const REAL_TESTIMONIALS: Testimonial[] = [];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="text-primary h-4 w-4" fill="currentColor" />
      ))}
    </div>
  );
}

export function TestimonialsSection({ motionProps }: SectionProps) {
  const hasTestimonials = REAL_TESTIMONIALS.length >= 3;

  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            {hasTestimonials ? 'Clientes reales' : 'Estamos empezando'}
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            {hasTestimonials
              ? 'Lo que dicen quienes ya confiaron en EPDE.'
              : 'Estamos con los primeros clientes de Paraná.'}
          </motion.h2>
        </div>

        {hasTestimonials ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {REAL_TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                variants={STAGGER_ITEM}
                className="border-border bg-card rounded-2xl border p-6"
              >
                <StarRating />
                <p className="type-body-md text-foreground/90 mt-4 italic">{t.quote}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <User className="text-muted-foreground h-5 w-5" />
                  </div>
                  <div>
                    <p className="type-body-sm text-foreground font-medium">{t.name}</p>
                    <p className="type-body-sm text-muted-foreground">
                      {t.propertyType} · {t.neighborhood}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={FADE_IN_UP}
            className="border-border bg-card mx-auto mt-10 max-w-2xl rounded-xl border p-6 text-center"
          >
            <div className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <Clock className="text-primary h-5 w-5" aria-hidden="true" />
            </div>
            <p className="type-body-md text-foreground mt-4 font-medium">
              Preferimos no mostrar testimonios fabricados.
            </p>
            <p className="type-body-sm text-muted-foreground mt-2 leading-relaxed">
              Cuando tengamos las primeras historias reales de familias que empezaron con EPDE, las
              vas a ver acá con nombre, barrio y experiencia concreta. Mientras tanto, preferimos
              ser transparentes: estás entre los primeros.
            </p>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
