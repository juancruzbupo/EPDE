import {
  formatARSCompact,
  TECHNICAL_INSPECTION_CLIENT_DISCOUNT_PCT,
  TECHNICAL_INSPECTION_PRICE_DISCLAIMER,
  TECHNICAL_INSPECTION_PRICES,
  WHATSAPP_CONTACT_NUMBER,
} from '@epde/shared';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  FileCheck2,
  Info,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FADE_IN, FADE_IN_UP, STAGGER_CONTAINER, STAGGER_ITEM } from '@/lib/motion';

import type { SectionProps } from '../landing-data';

const INSPECTION_TYPES = [
  {
    key: 'BASIC' as const,
    name: 'Informe técnico básico',
    summary:
      'Visita corta e informe del estado general. Para quienes quieren una opinión profesional antes de alquilar, mudarse o cerrar dudas.',
  },
  {
    key: 'STRUCTURAL' as const,
    name: 'Informe estructural profundo',
    summary:
      'Revisión detallada de humedad, grietas, paredes de carga, techos y cimientos. Útil para herencias, divorcios o problemas acumulados.',
  },
  {
    key: 'SALE' as const,
    name: 'Informe para compraventa',
    summary:
      'Informe completo con revisión de instalaciones (gas, luz, agua), estructura y cumplimiento normativo. Firmado por arquitecta matriculada.',
  },
];

/**
 * Construye un link a WhatsApp prellenado con el interés del lead.
 * El tipo de informe viaja en el texto para que la arquitecta pueda
 * priorizar la respuesta sin preguntar de vuelta.
 */
function buildInspectionWhatsAppUrl(type: (typeof INSPECTION_TYPES)[number]): string {
  const text = `Hola, quisiera contratar un ${type.name.toLowerCase()} para mi vivienda. ¿Podemos coordinar?`;
  return `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent(text)}`;
}

const GENERAL_WHATSAPP_URL = `https://wa.me/${WHATSAPP_CONTACT_NUMBER}?text=${encodeURIComponent(
  'Hola, me interesa un informe técnico firmado. ¿Me podrían asesorar sobre cuál necesito?',
)}`;

export function TechnicalInspectionSection({ motionProps }: SectionProps) {
  return (
    <section className="bg-background py-20 md:py-28">
      <motion.div variants={STAGGER_CONTAINER} {...motionProps} className="mx-auto max-w-5xl px-4">
        <motion.p
          variants={FADE_IN}
          className="type-label-md text-primary tracking-widest uppercase"
        >
          Servicio adicional · abierto al público
        </motion.p>
        <motion.h2
          variants={FADE_IN_UP}
          className="font-heading text-foreground mt-4 text-3xl tracking-tight sm:text-4xl"
        >
          Informes técnicos firmados.
          <br />
          <span className="text-muted-foreground">
            Disponibles para cualquiera — clientes EPDE pagan{' '}
            {TECHNICAL_INSPECTION_CLIENT_DISCOUNT_PCT}% menos.
          </span>
        </motion.h2>
        <motion.p
          variants={FADE_IN_UP}
          className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed"
        >
          Cuando necesitás un informe profesional firmado —para una compraventa, una herencia o un
          problema específico— lo hace directamente la arquitecta responsable de EPDE, con matrícula
          habilitante. No hace falta ser cliente: lo podés contratar una sola vez.
        </motion.p>
        <motion.div
          variants={FADE_IN}
          className="border-primary/30 bg-primary/5 mt-5 max-w-2xl rounded-lg border-l-2 p-3"
        >
          <p className="text-foreground text-sm leading-relaxed">
            <strong>No confundir:</strong> el <strong>diagnóstico inicial</strong> de tu casa está
            incluido en tu plan EPDE (es la visita que hacemos al empezar). Los{' '}
            <strong>informes técnicos firmados</strong> de esta sección son un servicio aparte, para
            cuando necesitás un PDF con firma y matrícula para presentar en una escribanía, en un
            trámite de herencia o en un banco.
          </p>
        </motion.div>

        <motion.div variants={FADE_IN_UP} className="mt-10 grid gap-4 sm:grid-cols-3">
          {INSPECTION_TYPES.map((type) => {
            const tiers = TECHNICAL_INSPECTION_PRICES[type.key];
            return (
              <motion.div
                key={type.key}
                variants={STAGGER_ITEM}
                className="border-border bg-card flex flex-col rounded-xl border p-5"
              >
                <h3 className="font-heading text-foreground mb-1 text-lg">{type.name}</h3>
                <p className="text-primary mb-3 text-2xl font-bold tabular-nums">
                  desde {formatARSCompact(tiers.SMALL.public)}
                </p>
                <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{type.summary}</p>

                {/* Ambos precios por tier — público (sin descuento) y cliente EPDE.
                 *  Mostrar el par hace visible el ahorro concreto del plan. */}
                <div className="border-border/50 mt-auto space-y-2 border-t pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-semibold">Precios por superficie</p>
                    <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                      Público · Cliente
                    </span>
                  </div>
                  <div className="text-muted-foreground space-y-1">
                    {(['SMALL', 'MEDIUM', 'LARGE'] as const).map((tier) => (
                      <div key={tier} className="flex justify-between tabular-nums">
                        <span>{tiers[tier].label}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="line-through opacity-60">
                            {formatARSCompact(tiers[tier].public)}
                          </span>
                          <span className="text-foreground font-medium">
                            {formatARSCompact(tiers[tier].client)}
                          </span>
                        </span>
                      </div>
                    ))}
                    <div className="text-muted-foreground/80 flex justify-between text-[11px] italic">
                      <span>Más de 400 m²</span>
                      <span>consultar</span>
                    </div>
                  </div>
                </div>

                <Button asChild size="sm" variant="outline" className="mt-4 w-full">
                  <a
                    href={buildInspectionWhatsAppUrl(type)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                    Pedir este informe
                  </a>
                </Button>
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
            <Sparkles className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-foreground text-sm font-medium">
                {TECHNICAL_INSPECTION_CLIENT_DISCOUNT_PCT}% de descuento para clientes EPDE
              </p>
              <p className="text-muted-foreground text-xs">
                Si tenés el plan EPDE activo, el descuento se aplica automáticamente al cotizar.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-foreground text-sm font-medium">Firmado por arquitecta</p>
              <p className="text-muted-foreground text-xs">
                Profesional matriculada. Apto para presentar en escribanía o compraventa.
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
              <strong className="text-foreground">Aclaración:</strong> el informe para compraventa{' '}
              <strong>no incluye</strong> oblea de gas (NAG-226) firmada por gasista matriculado ni
              informe eléctrico RE-7 firmado por electricista matriculado. Si tu trámite los exige,
              los cotiza aparte el gasista o electricista habilitado, según el caso.
            </span>
          </p>
        </motion.div>

        {/* CTA genérico + upsell al plan. Cross-sell sutil: después del
         *  informe, sumarse al plan EPDE queda automáticamente con 15% en
         *  futuros informes. No forzado, es una invitación. */}
        <motion.div
          variants={FADE_IN_UP}
          className="border-primary/20 bg-primary/5 mt-8 flex flex-col items-start gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex-1">
            <p className="text-foreground type-title-sm font-semibold">
              ¿No estás seguro de cuál informe necesitás?
            </p>
            <p className="text-muted-foreground type-body-sm mt-1">
              Escribinos por WhatsApp y la arquitecta te orienta sin compromiso. Si después del
              informe querés seguimiento continuo, sumate al plan EPDE y en tu próximo informe el{' '}
              {TECHNICAL_INSPECTION_CLIENT_DISCOUNT_PCT}% de descuento se aplica solo.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <a href={GENERAL_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Consultar por WhatsApp
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
