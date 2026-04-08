import type { PropertySector } from '../types/enums';

interface InspectionItemTemplate {
  name: string;
  description: string;
}

/** Default inspection checklist items per sector. Used to create initial checklists. */
export const DEFAULT_INSPECTION_ITEMS: Record<PropertySector, InspectionItemTemplate[]> = {
  EXTERIOR: [
    {
      name: 'Estado de muros exteriores',
      description: 'Buscar fisuras, manchas de humedad, descascaramiento de pintura o revoque.',
    },
    {
      name: 'Revestimientos y pintura',
      description: 'Verificar adherencia, ampollas, decoloración.',
    },
    {
      name: 'Juntas de dilatación',
      description: 'Comprobar que estén selladas y sin material faltante.',
    },
    {
      name: 'Desagües pluviales',
      description: 'Verificar que no estén obstruidos y que el agua escurra correctamente.',
    },
    {
      name: 'Veredas perimetrales',
      description: 'Revisar pendientes, fisuras, separación del muro.',
    },
  ],
  ROOF: [
    {
      name: 'Estado de la cubierta',
      description: 'Revisar tejas, membrana o chapa: fisuras, roturas, levantamientos.',
    },
    {
      name: 'Canaletas y bajadas',
      description: 'Verificar limpieza, pendiente correcta, uniones selladas.',
    },
    {
      name: 'Babetas y encuentros',
      description: 'Revisar sellado en uniones con muros, chimeneas, ventilaciones.',
    },
    { name: 'Ventilaciones', description: 'Comprobar que estén libres de obstrucciones.' },
  ],
  TERRACE: [
    {
      name: 'Membrana impermeabilizante',
      description:
        'Buscar burbujas, fisuras, desprendimientos. Verificar fecha de última aplicación.',
    },
    {
      name: 'Pendientes y desagües',
      description: 'Verificar que el agua no se acumule en ningún punto.',
    },
    {
      name: 'Barandas y bordes',
      description: 'Revisar fijación, oxidación, altura reglamentaria.',
    },
    { name: 'Solado', description: 'Buscar fisuras, baldosas flojas o faltantes.' },
  ],
  INTERIOR: [
    {
      name: 'Paredes y cielorrasos',
      description: 'Buscar manchas de humedad, fisuras, desprendimientos.',
    },
    { name: 'Pisos', description: 'Revisar nivelación, fisuras, juntas deterioradas.' },
    { name: 'Aberturas', description: 'Verificar cierre correcto, sellado, estado de burletes.' },
    { name: 'Ventilación natural', description: 'Comprobar circulación de aire en ambientes.' },
  ],
  KITCHEN: [
    {
      name: 'Grifería y conexiones',
      description: 'Buscar pérdidas en canillas, flexibles, llaves de paso.',
    },
    {
      name: 'Desagües',
      description: 'Verificar velocidad de desagote, buscar pérdidas bajo mesada.',
    },
    {
      name: 'Conexión de gas',
      description: 'Revisar flexible, llave de paso, fecha de vencimiento del flexible.',
    },
    {
      name: 'Ventilación y extracción',
      description: 'Verificar funcionamiento de extractor y ventilación reglamentaria.',
    },
  ],
  BATHROOM: [
    {
      name: 'Grifería y conexiones',
      description: 'Buscar pérdidas en canillas, flexibles, válvulas.',
    },
    {
      name: 'Desagües y sifones',
      description: 'Verificar velocidad de desagote, olores, pérdidas.',
    },
    {
      name: 'Sellado de ducha/bañera',
      description: 'Revisar silicona, juntas, estado del rejunte.',
    },
    { name: 'Ventilación', description: 'Verificar extractor o ventilación natural.' },
  ],
  BASEMENT: [
    {
      name: 'Humedad ascendente',
      description: 'Buscar manchas, eflorescencias, moho en la base de muros.',
    },
    {
      name: 'Fundaciones visibles',
      description: 'Revisar fisuras, desprendimientos, signos de asentamiento.',
    },
    { name: 'Ventilación del subsuelo', description: 'Verificar rejillas y circulación de aire.' },
    {
      name: 'Instalaciones visibles',
      description: 'Revisar estado de cañerías y cables expuestos.',
    },
  ],
  GARDEN: [
    {
      name: 'Árboles cerca de muros',
      description: 'Verificar que raíces no afecten cimientos ni cañerías.',
    },
    {
      name: 'Pendientes del terreno',
      description: 'Comprobar que el agua escurra hacia afuera de la vivienda.',
    },
    { name: 'Cercos y medianeras', description: 'Revisar estado, fijación, inclinación.' },
  ],
  INSTALLATIONS: [
    {
      name: 'Tablero eléctrico',
      description: 'Verificar térmicas, diferencial, puesta a tierra. Probar botón de test.',
    },
    {
      name: 'Cañerías de agua',
      description: 'Revisar llaves de paso, estado de cañerías visibles, presión.',
    },
    {
      name: 'Tanque de agua',
      description: 'Verificar tapa, flotante, estado general, fecha de última limpieza.',
    },
    {
      name: 'Termotanque/calefón',
      description: 'Revisar piloto, tiraje, ventilación, estado del ánodo (si aplica).',
    },
    {
      name: 'Instalación de gas',
      description: 'Verificar artefactos, ventilaciones reglamentarias, estado de flexibles.',
    },
  ],
};
