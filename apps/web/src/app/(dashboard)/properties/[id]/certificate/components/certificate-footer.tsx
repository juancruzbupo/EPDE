import React from 'react';

export const CertificateFooter = React.memo(function CertificateFooter() {
  return (
    <section className="mb-10">
      <div className="bg-muted/30 rounded-lg p-4 text-center">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Este certificado acredita que la vivienda fue sometida a un programa de mantenimiento
          preventivo profesional bajo supervisión de EPDE. Es un documento privado emitido con fines
          informativos; <strong>no reemplaza certificados oficiales</strong> requeridos por bancos
          (tasación hipotecaria), aseguradoras (inspección técnica propia, oblea NAG-226 de gas,
          informe eléctrico) ni escribanías. Útil como respaldo documental ante compradores,
          inmobiliarias o tasadores. No constituye garantía sobre el estado futuro del inmueble.
        </p>
      </div>
    </section>
  );
});
