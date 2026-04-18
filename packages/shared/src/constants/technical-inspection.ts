import type { InspectionPriceTier } from '../types/enums';

/**
 * Technical Inspection pricing (ARS, abril 2026) — tiers por superficie.
 *
 * Justificación: una casa de 80 m² en PB no implica las mismas horas de
 * trabajo que una casona de 300 m² en dos plantas. Tiers por m² evitan
 * sub-cotizar casas grandes y sobre-cotizar casas chicas, y preservan el
 * margen sin agregar un flujo de presupuesto manual.
 *
 * Cortes derivados del arancel CAPBA por superficie + observación de
 * tiempos reales. Precio público es el tope por tier; EPDE cliente
 * obtiene 15% off (retention perk).
 */
export interface InspectionPriceEntry {
  public: number;
  client: number;
  /** Inclusive upper bound in m² (null = sin tope). */
  maxSqm: number | null;
  label: string;
}

export const TECHNICAL_INSPECTION_PRICES: Record<
  'BASIC' | 'STRUCTURAL' | 'SALE',
  Record<InspectionPriceTier, InspectionPriceEntry>
> = {
  BASIC: {
    SMALL: { public: 135000, client: 114750, maxSqm: 120, label: 'Hasta 120 m²' },
    MEDIUM: { public: 180000, client: 153000, maxSqm: 250, label: '120 a 250 m²' },
    LARGE: { public: 250000, client: 212500, maxSqm: null, label: 'Más de 250 m²' },
  },
  STRUCTURAL: {
    SMALL: { public: 450000, client: 382500, maxSqm: 120, label: 'Hasta 120 m²' },
    MEDIUM: { public: 580000, client: 493000, maxSqm: 250, label: '120 a 250 m²' },
    LARGE: { public: 780000, client: 663000, maxSqm: 400, label: '250 a 400 m²' },
  },
  SALE: {
    SMALL: { public: 775000, client: 658750, maxSqm: 120, label: 'Hasta 120 m²' },
    MEDIUM: { public: 1000000, client: 850000, maxSqm: 250, label: '120 a 250 m²' },
    LARGE: { public: 1400000, client: 1190000, maxSqm: 400, label: '250 a 400 m²' },
  },
};

/** Superficie máxima para tier-pricing. Propiedades más grandes requieren cotización manual. */
export const INSPECTION_OVERSIZED_THRESHOLD_SQM = 400;

/**
 * Disclaimer legal/comercial para mostrar en landing y dialog.
 * Basado en Ley 24.240 (Defensa del Consumidor) + transparencia de fuentes.
 */
export const TECHNICAL_INSPECTION_PRICE_DISCLAIMER =
  'Precios orientativos actualizados a abril 2026 y basados en aranceles profesionales de CAPER / CAPBA / CPAU + valores de mercado para Paraná y Gran Paraná. Los tiers se aplican según la superficie declarada de la propiedad. Casos con características atípicas (vivienda en altura, más de 2 plantas, superficie mayor a 400 m² o acceso dificultoso) pueden requerir cotización ajustada — te lo avisamos al recibir tu solicitud.';

export const TECHNICAL_INSPECTION_CLIENT_DISCOUNT_PCT = 15;

/**
 * Resuelve el tier según la superficie de la propiedad. Si es null/0,
 * devuelve MEDIUM como fallback conservador (el admin puede ajustar
 * manualmente si la propiedad es atípica).
 */
export function resolveInspectionPriceTier(
  squareMeters: number | null | undefined,
): InspectionPriceTier {
  if (!squareMeters || squareMeters <= 0) return 'MEDIUM';
  if (squareMeters <= 120) return 'SMALL';
  if (squareMeters <= 250) return 'MEDIUM';
  return 'LARGE';
}

/**
 * Indica si la propiedad excede el tope de tier-pricing. En ese caso el
 * cliente debe pedir cotización manual por WhatsApp — la UI bloquea el
 * submit para evitar sub-cotizar.
 */
export function isOversizedForInspection(squareMeters: number | null | undefined): boolean {
  return typeof squareMeters === 'number' && squareMeters > INSPECTION_OVERSIZED_THRESHOLD_SQM;
}

/**
 * Calcula el precio congelado al crear una inspección.
 * Cliente con plan activo obtiene el precio cliente; sin plan, el público.
 */
export function calculateInspectionFee(
  type: 'BASIC' | 'STRUCTURAL' | 'SALE',
  squareMeters: number | null | undefined,
  hasActivePlan: boolean,
): { amount: number; tier: InspectionPriceTier } {
  const tier = resolveInspectionPriceTier(squareMeters);
  const entry = TECHNICAL_INSPECTION_PRICES[type][tier];
  return { amount: hasActivePlan ? entry.client : entry.public, tier };
}

export const TECHNICAL_INSPECTION_LABELS = {
  BASIC: 'Informe técnico básico',
  STRUCTURAL: 'Informe estructural profundo',
  SALE: 'Informe para compraventa',
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
  REQUESTED: 'Solicitado',
  SCHEDULED: 'Visita agendada',
  IN_PROGRESS: 'En preparación',
  REPORT_READY: 'Informe listo — pendiente de pago',
  PAID: 'Pagado',
  CANCELED: 'Cancelado',
} as const;

export const TECHNICAL_INSPECTION_TYPE_LABELS = TECHNICAL_INSPECTION_LABELS;

export const TECHNICAL_INSPECTION_PAYMENT_STATUS_LABELS = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  CANCELED: 'Cancelado',
} as const;

/**
 * Listado de actividades de campo que la arquitecta ejecuta por tipo de
 * inspección. Se usa tanto para transparencia al cliente (dialog al solicitar)
 * como para referencia operativa del admin durante la visita.
 */
export const TECHNICAL_INSPECTION_ACTIVITIES = {
  BASIC: [
    'Relevamiento visual exterior: fachada, medianeras, vereda, y cubierta desde nivel de suelo',
    'Relevamiento visual interior de todos los ambientes: estar, dormitorios, baños, cocina, lavadero, pasillos',
    'Detección de fisuras superficiales y medición básica con fisurómetro',
    'Detección de humedad visible: manchas, desprendimientos de pintura, eflorescencias, condensación',
    'Chequeo de funcionamiento de aberturas (puertas, ventanas): cierre, trabas, bisagras',
    'Chequeo visual sanitario: canillas, depósitos inodoro, rejillas, descargas (apertura y cierre, sin ensayo de presión)',
    'Chequeo visual eléctrico: tablero accesible, llaves termo/disyuntor, tomas y luces en funcionamiento',
    'Relevamiento fotográfico georreferenciado de cada hallazgo',
    'Informe de 5–10 páginas con estado general, fotos, y recomendaciones priorizadas',
  ],
  STRUCTURAL: [
    'Todo lo incluido en la inspección básica, más:',
    'Análisis detallado de fisuras: clasificación (superficial vs activa vs estructural), medición de ancho/largo/profundidad, orientación',
    'Ensayo de percusión en revoques para detectar desprendimientos ocultos',
    'Medición de humedad ascendente y descendente con humidímetro de contacto en muros críticos',
    'Detección de humedad oculta por diferencia térmica (cámara termográfica)',
    'Inspección de cubierta con acceso: estado de membrana, babetas, canaletas, bajadas pluviales, sumideros',
    'Evaluación de muros portantes y tabiques: verticalidad con plomada/nivel láser, continuidad, apoyos',
    'Inspección de fundaciones visibles: filtraciones, asentamientos diferenciales',
    'Relevamiento de contrapisos y pisos: fisuras, desniveles, dilataciones mal resueltas',
    'Evaluación de entrepisos/losas visibles: deflexión, fisuras por flexión o esfuerzos',
    'Informe de 15–20 páginas con diagnóstico estructural, priorización de intervenciones, y plazos recomendados',
  ],
  SALE: [
    'Todo lo incluido en la inspección estructural profunda, más:',
    'Verificación documental inicial: cotejo con plano conforme a obra y dominio (si el cliente lo aporta)',
    'Chequeo de habitabilidad: superficies mínimas, ventilación e iluminación de ambientes',
    'Inspección visual de instalación de gas: estado de artefactos, ventilación, conductos, sin firma de matrícula (se recomienda gasista aparte)',
    'Inspección visual de instalación eléctrica: dimensionamiento tablero, protecciones térmicas/diferenciales, puesta a tierra con probador',
    'Inspección de instalación sanitaria: presión de agua caliente/fría, ensayo de descarga en todos los artefactos, chequeo de tanque de reserva',
    'Verificación de artefactos incluidos en la compraventa: caldera, termotanque, cocina, aires acondicionados, portón automatizado',
    'Relevamiento de carpinterías: estado marcos, vidrios, herrajes, hermeticidad',
    'Chequeo de sistemas de acceso y seguridad: cerraduras, portones, rejas',
    'Revisión completa de cubierta con acceso y fotografías aéreas si aplica',
    'Informe de 20–30 páginas formato due-diligence: observaciones priorizadas por riesgo + costo estimado de adecuación + listado de matrículas complementarias requeridas (oblea NAG-226, RE-7)',
  ],
} as const;

/**
 * Equipamiento mínimo que la arquitecta lleva a cada visita, por tipo.
 * Inventario de referencia — no necesariamente se usa todo en cada
 * inspección, pero debe estar disponible.
 */
export const TECHNICAL_INSPECTION_TOOLS = {
  BASIC: [
    'Linterna LED recargable ≥ 500 lúmenes',
    'Humidímetro ambiental (higrómetro digital)',
    'Cinta métrica 5 m + metro láser corto (hasta 20 m)',
    'Nivel de burbuja 60 cm y escuadra metálica',
    'Fisurómetro (tarjeta graduada con líneas patrón)',
    'Cámara fotográfica con fecha/hora o celular profesional',
    'Tablet con planilla de relevamiento digital',
    'Elementos de seguridad: casco, guantes, barbijo N95',
  ],
  STRUCTURAL: [
    'Todo el equipo de la inspección básica, más:',
    'Humidímetro de contacto (pin-type) para medición puntual en muros',
    'Medidor de humedad dieléctrico no invasivo para muros terminados',
    'Cámara termográfica (mínimo 160×120 px) para humedad oculta y puentes térmicos',
    'Fisurómetro digital o testigos de yeso para monitoreo de evolución',
    'Martillo de inspección o martillo geológico liviano para percusión de revoques',
    'Plomada de albañil y nivel láser rotativo (rango 20 m)',
    'Escalera telescópica 4–6 m o arnés de seguridad con línea de vida para acceso a cubierta',
    'Endoscopio rígido o boroscopio para cavidades accesibles',
    'Metro láser de largo alcance (hasta 40 m) para naves o patios grandes',
  ],
  SALE: [
    'Todo el equipo de la inspección estructural, más:',
    'Pinza amperométrica / multímetro CAT III 600 V',
    'Probador de tomacorrientes con test de polaridad y puesta a tierra',
    'Detector de tensión sin contacto y buscapolos',
    'Manómetro para prueba de presión de agua (bar/psi)',
    'Termómetro infrarrojo (IR gun) para verificación térmica de artefactos',
    'Detector portátil de monóxido de carbono para ambientes con combustión',
    'Cronómetro y probeta para verificación de caudal de canillas y descargas',
    'Dron con cámara HD (opcional, para cubiertas extensas o techos inaccesibles)',
    'Formulario due-diligence con checklist normativo (habitabilidad, NAG-226, RE-7) para derivar a matrículas complementarias',
  ],
} as const;
