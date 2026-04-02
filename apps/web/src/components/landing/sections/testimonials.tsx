import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

interface Testimonial {
  name: string;
  neighborhood: string;
  quote: string;
  propertyType: string;
}

const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Nombre del cliente',
    neighborhood: 'Barrio, Paraná',
    quote:
      '"Acá va el testimonio real del cliente contando su experiencia con EPDE y cómo le ayudó a cuidar su casa."',
    propertyType: 'Casa',
  },
  {
    name: 'Nombre del cliente',
    neighborhood: 'Barrio, Paraná',
    quote:
      '"Acá va otro testimonio real. Idealmente de un perfil diferente: otro barrio, otro tipo de propiedad, otra edad."',
    propertyType: 'Departamento',
  },
  {
    name: 'Nombre del cliente',
    neighborhood: 'Barrio, Paraná',
    quote:
      '"Un tercer testimonio. 3 testimonios es el número ideal para generar confianza sin abrumar."',
    propertyType: 'Dúplex',
  },
];

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
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <motion.p
            variants={FADE_IN}
            className="type-label-md text-primary tracking-widest uppercase"
          >
            Clientes reales
          </motion.p>
          <motion.h2
            variants={FADE_IN_UP}
            className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
          >
            Lo que dicen quienes ya confiaron en EPDE.
          </motion.h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLACEHOLDER_TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              variants={STAGGER_ITEM}
              className="border-border bg-card rounded-2xl border p-6"
            >
              <StarRating />
              <p className="type-body-md text-foreground/90 mt-4 italic">{t.quote}</p>
              <div className="mt-6 flex items-center gap-3">
                {/* Replace with real photo: <Image src={...} /> */}
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

        <motion.p
          variants={FADE_IN}
          className="type-body-sm text-muted-foreground/60 mx-auto mt-8 max-w-md text-center"
        >
          Estos testimonios son placeholders. Se reemplazarán con clientes reales una vez que se
          tengan las primeras 3 experiencias completadas.
        </motion.p>
      </motion.div>
    </section>
  );
}
