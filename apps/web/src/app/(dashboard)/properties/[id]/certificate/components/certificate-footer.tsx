import React from 'react';

export const CertificateFooter = React.memo(function CertificateFooter() {
  return (
    <section className="mb-10">
      <div className="bg-muted/30 rounded-lg p-5 text-left">
        <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
          <strong className="text-foreground">Naturaleza del documento:</strong> Constancia privada
          emitida por EPDE (Estudio Profesional de Diagnóstico Edilicio) bajo dirección profesional
          de la arquitecta responsable, a través de su sistema de seguimiento de mantenimiento
          preventivo. Deja registro de las tareas ejecutadas sobre la vivienda durante el período
          indicado.
        </p>
        <p className="text-muted-foreground mb-2 text-xs leading-relaxed">
          <strong className="text-foreground">El presente NO constituye:</strong>
        </p>
        <ul className="text-muted-foreground mb-3 ml-4 list-disc space-y-0.5 text-xs leading-relaxed">
          <li>certificado oficial de habitabilidad, estructura o instalaciones;</li>
          <li>tasación hipotecaria según normativa del BCRA;</li>
          <li>oblea NAG-226 de gas, ni informe eléctrico para aseguradoras;</li>
          <li>garantía sobre el estado presente o futuro del inmueble;</li>
          <li>
            sustituto de inspección técnica por profesional designado por comprador o tercero
            contratante.
          </li>
        </ul>
        <p className="text-muted-foreground text-xs leading-relaxed italic">
          Uso sugerido: historial informativo complementario ante compradores o inmobiliarias. Su
          validez está sujeta al mantenimiento continuo del plan.
        </p>
      </div>
    </section>
  );
});
