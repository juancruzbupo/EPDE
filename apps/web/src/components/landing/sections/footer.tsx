import { Phone } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import type { LandingGeneral } from '@/types/landing-settings';

import { PHONE_DISPLAY, PHONE_NUMBER } from '../landing-data';

function formatPhoneDisplay(p: string): string {
  const local = p.replace(/^549/, '');
  if (local.length === 10) return `${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`;
  return p;
}

interface FooterProps {
  general?: LandingGeneral;
}

export function Footer({ general }: FooterProps) {
  const phone = general?.phone || PHONE_NUMBER;
  const phoneDisplay = general?.phone ? formatPhoneDisplay(general.phone) : PHONE_DISPLAY;
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
              <a
                href={`tel:+${phone}`}
                className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1.5 text-sm transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                {phoneDisplay}
              </a>
            </div>
            <div className="text-center sm:text-right">
              <p className="type-body-sm text-muted-foreground">
                Diagnóstico profesional y mantenimiento preventivo de viviendas.
              </p>
              <a
                href={ROUTES.login}
                className="text-muted-foreground hover:text-foreground mt-1 inline-block text-sm underline underline-offset-2 transition-colors"
              >
                Ya soy cliente
              </a>
              <p className="type-body-sm text-muted-foreground/60 mt-1">
                &copy; {new Date().getFullYear()} EPDE. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
