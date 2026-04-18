import React from 'react';

export const CertificateFooter = React.memo(function CertificateFooter() {
  return (
    <section className="mb-10">
      <div className="bg-muted/30 rounded-lg p-4 text-center">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Este certificado acredita que la vivienda fue sometida a un programa de mantenimiento
          preventivo profesional bajo supervisión de EPDE. No constituye garantía sobre el estado
          futuro del inmueble. La validez del certificado está sujeta al mantenimiento continuo del
          plan de mantenimiento preventivo.
        </p>
      </div>
    </section>
  );
});
