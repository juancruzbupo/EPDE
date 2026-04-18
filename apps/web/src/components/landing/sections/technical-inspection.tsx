import {
  formatARSCompact,
  TECHNICAL_INSPECTION_CLIENT_DISCOUNT_PCT,
  TECHNICAL_INSPECTION_PRICE_DISCLAIMER,
  TECHNICAL_INSPECTION_PRICES,
} from '@epde/shared';
import { motion } from 'framer-motion';
import { ClipboardCheck, FileCheck2, Info, Lock, ShieldCheck } from 'lucide-react';

import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

const INSPECTION_TYPES = [
  {
    key: 'BASIC' as const,
    name: 'Inspección básica',
    summary:
      'Visita corta e informe de estado general. Para propietarios que quieren un diagnóstico previo a alquiler o mudanza.',
  },
  {
    key: 'STRUCTURAL' as const,
    name: 'Estructural profunda',
    summary:
      'Relevamiento de humedad, fisuras, muros portantes, cubierta y fundaciones. Útil para herencias, divorcios o problemas acumulados.',
  },
  {
    key: 'SALE' as const,
    name: 'Para compraventa',
    summary:
      'Informe completo con verificación de instalaciones, estructura y cumplimiento normativo. Firmado por arquitecta matriculada.',
  },
];

export function TechnicalInspectionSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-background py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-5xl px-4">
        <motion.p
          variants={FADE_IN}
          className="type-label-md text-primary tracking-widest uppercase"
        >
          Servicio adicional
        </motion.p>
        <motion.h2
          variants={FADE_IN_UP}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Inspecciones técnicas firmadas.
          <br />
          <span className="text-muted-foreground">Con 15% off para clientes EPDE.</span>
        </motion.h2>
        <motion.p
          variants={FADE_IN_UP}
          className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed"
        >
          Cuando necesitás un informe profesional firmado — para compraventa, herencia, un problema
          puntual — lo hace directamente la arquitecta responsable de EPDE, con matrícula
          habilitante. Se paga aparte del plan de mantenimiento.
        </motion.p>

        <motion.div variants={FADE_IN_UP} className="mt-10 grid gap-4 sm:grid-cols-3">
          {INSPECTION_TYPES.map((type) => {
            const tiers = TECHNICAL_INSPECTION_PRICES[type.key];
            return (
              <motion.div
                key={type.key}
                variants={STAGGER_ITEM}
                className="border-border bg-card rounded-xl border p-5"
              >
                <h3 className="font-heading text-foreground mb-1 text-lg">{type.name}</h3>
                <p className="text-primary mb-3 text-2xl font-bold tabular-nums">
                  desde {formatARSCompact(tiers.SMALL.client)}
                </p>
                <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{type.summary}</p>
                <div className="border-border/50 mt-3 space-y-1 border-t pt-3 text-xs">
                  <p className="text-foreground font-semibold">Precio cliente EPDE</p>
                  <div className="text-muted-foreground space-y-0.5">
                    <div className="flex justify-between tabular-nums">
                      <span>Hasta 120 m²</span>
                      <span>{formatARSCompact(tiers.SMALL.client)}</span>
                    </div>
                    <div className="flex justify-between tabular-nums">
                      <span>120–250 m²</span>
                      <span>{formatARSCompact(tiers.MEDIUM.client)}</span>
                    </div>
                    <div className="flex justify-between tabular-nums">
                      <span>250–400 m²</span>
                      <span>{formatARSCompact(tiers.LARGE.client)}</span>
                    </div>
                    <div className="text-muted-foreground/80 flex justify-between text-[11px] italic">
                      <span>Más de 400 m²</span>
                      <span>consultar</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          variants={FADE_IN}
          className="border-border/60 bg-muted/20 mt-4 rounded-lg border p-3 text-xs"
        >
          <p className="text-muted-foreground flex items-start gap-2 leading-relaxed">
            <Info
              className="text-muted-foreground/70 mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>{TECHNICAL_INSPECTION_PRICE_DISCLAIMER}</span>
          </p>
        </motion.div>

        <motion.div variants={FADE_IN_UP} className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="flex gap-3">
            <Lock className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-foreground text-sm font-medium">Exclusivo clientes activos</p>
              <p className="text-muted-foreground text-xs">
                Tenés el {TECHNICAL_INSPECTION_CLIENT_DISCOUNT_PCT}% de descuento mientras tu
                suscripción esté al día.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-foreground text-sm font-medium">Firmado por arquitecta</p>
              <p className="text-muted-foreground text-xs">
                Profesional matriculada. Apto para presentar ante escribano o compra-venta.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <FileCheck2 className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-foreground text-sm font-medium">Pagás al recibir</p>
              <p className="text-muted-foreground text-xs">
                Primero entregamos el informe firmado. Después transferís. Sin anticipos.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={FADE_IN}
          className="border-border/60 bg-muted/30 mt-8 rounded-lg border-l-2 p-4 text-sm"
        >
          <p className="text-muted-foreground flex items-start gap-2 leading-relaxed">
            <ClipboardCheck className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong className="text-foreground">Aclaración:</strong> la inspección para
              compraventa <strong>no incluye</strong> oblea NAG-226 de gasista matriculado ni
              informe RE-7 de electricista matriculado (si tu trámite lo exige, se cotizan aparte
              por el profesional habilitado correspondiente).
            </span>
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
