import React from 'react';

export const ReportFooter = React.memo(function ReportFooter() {
  return (
    <section className="mb-10">
      <div className="border-border border-t pt-6 text-center">
        <p className="type-title-md font-heading text-primary">EPDE</p>
        <p className="text-muted-foreground text-sm">Estudio Profesional de Diagnóstico Edilicio</p>
        <p className="text-muted-foreground mt-2 text-xs">
          Informe generado el {new Date().toLocaleString('es-AR')}
        </p>
        <p className="text-muted-foreground mt-1 text-xs italic">
          Este informe refleja el estado de la vivienda al momento de su generación.
        </p>
      </div>
    </section>
  );
});
