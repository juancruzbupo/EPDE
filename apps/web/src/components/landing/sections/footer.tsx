import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { WHATSAPP_URL } from '../landing-data';

export function Footer() {
  return (
    <>
      <footer className="border-border border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div>
            <span className="font-heading text-primary text-lg">EPDE</span>
            <p className="type-body-sm text-muted-foreground mt-0.5">
              por Arq. Noelia E. Yuskowich
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="type-body-sm text-muted-foreground">
              Arquitectura aplicada al cuidado del hogar.
            </p>
            <p className="type-body-sm text-muted-foreground/60 mt-1">
              &copy; {new Date().getFullYear()} EPDE. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="border-border bg-background/95 fixed right-0 bottom-0 left-0 z-50 border-t p-2 backdrop-blur-sm md:hidden">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block">
          <Button size="sm" className="w-full gap-2">
            Quiero saber el estado de mi casa
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>
    </>
  );
}
