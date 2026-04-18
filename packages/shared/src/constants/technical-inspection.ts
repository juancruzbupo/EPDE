/**
 * Technical Inspection pricing (ARS, abril 2026).
 * Public prices derived from market research:
 *  - InspecThome mínimos + CheckHome USD 299-499 convertidos
 *  - CAPBA Informe Técnico aranceles mínimos
 *  - Mediana del rango para interior (Paraná, ER)
 * EPDE client discount: 15% (retention perk).
 */
export const TECHNICAL_INSPECTION_PRICES = {
  BASIC: { public: 135000, client: 114750 },
  STRUCTURAL: { public: 400000, client: 340000 },
  SALE: { public: 775000, client: 658750 },
} as const;

export const TECHNICAL_INSPECTION_CLIENT_DISCOUNT_PCT = 15;

export const TECHNICAL_INSPECTION_LABELS = {
  BASIC: 'Inspección técnica básica',
  STRUCTURAL: 'Inspección estructural profunda',
  SALE: 'Inspección para compraventa',
} as const;

export const TECHNICAL_INSPECTION_DESCRIPTIONS = {
  BASIC:
    'Visita de 1-2 horas e informe de 5-10 páginas con estado general de la vivienda y fotos. Útil para propietarios que quieren un diagnóstico previo a alquiler, mudanza o para cerrar dudas puntuales.',
  STRUCTURAL:
    'Medio día de visita con análisis estructural profundo (humedad, fisuras, muros portantes, cubierta, fundaciones). Informe de 15-20 páginas con fotos georeferenciadas. Útil para herencias, divorcios o problemas acumulados.',
  SALE: 'Informe completo de 20-30 páginas para compraventa, con verificación de instalaciones (gas, electricidad, agua), estructura y cumplimiento normativo. Firmado por arquitecta matriculada. Apto para presentar ante escribano. NO incluye oblea NAG-226 ni informe RE-7 (se cotizan aparte con gasista/electricista matriculado si corresponde).',
} as const;

export const TECHNICAL_INSPECTION_ESTIMATED_DAYS = {
  BASIC: '3 a 5 días laborales',
  STRUCTURAL: '5 a 7 días laborales',
  SALE: '7 a 10 días laborales',
} as const;

export const TECHNICAL_INSPECTION_STATUS_LABELS = {
  REQUESTED: 'Solicitada',
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'En curso',
  REPORT_READY: 'Informe listo — pendiente de pago',
  PAID: 'Pagada',
  CANCELED: 'Cancelada',
} as const;

export const TECHNICAL_INSPECTION_TYPE_LABELS = TECHNICAL_INSPECTION_LABELS;

export const TECHNICAL_INSPECTION_PAYMENT_STATUS_LABELS = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  CANCELED: 'Cancelado',
} as const;
