import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { PRIMARY_CTA_LABEL, WHATSAPP_URL } from '../landing-data';

export function Footer() {
  return (
    <>
      <footer className="border-border border-t py-10">
        <div className="mx-auto max-w-6xl px-4">
          {/* Disclaimer */}
          <div className="border-border mb-8 border-b pb-8">
            <p className="type-label-md text-muted-foreground mb-2 font-medium">
              Alcance del servicio
            </p>
            <p className="type-body-sm text-muted-foreground/70 max-w-3xl">
              EPDE realiza un diagnóstico edilicio basado en inspección visual con fines
              informativos y preventivos. No reemplaza estudios técnicos especializados (como
              análisis estructural o de suelos) ni garantiza la detección de todos los problemas
              existentes o futuros. Los trabajos de inspección, reparación o mejora se presupuestan
              y contratan de forma independiente al diagnóstico inicial. Las decisiones tomadas a
              partir del informe son responsabilidad del propietario.
            </p>
          </div>

          {/* Footer content */}
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <span className="font-heading text-primary text-lg">EPDE</span>
              <p className="type-body-sm text-foreground/70 mt-0.5 font-medium">
                Tu casa, bajo control.
              </p>
              <p className="type-body-sm text-muted-foreground mt-0.5">
                por Arq. Noelia E. Yuskowich
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="type-body-sm text-muted-foreground">
                Diagnóstico profesional y mantenimiento preventivo de viviendas.
              </p>
              <p className="type-body-sm text-muted-foreground/60 mt-1">
                &copy; {new Date().getFullYear()} EPDE. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="border-border bg-background/95 fixed right-0 bottom-0 left-0 z-40 border-t p-3 backdrop-blur-sm md:hidden">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block">
          <Button size="default" className="w-full gap-2">
            {PRIMARY_CTA_LABEL}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </>
  );
}
