export interface TaskTemplateSeed {
  name: string;
  taskType: string;
  professionalRequirement: string;
  technicalDescription?: string;
  priority: string;
  recurrenceType: string;
  recurrenceMonths: number;
  estimatedDurationMinutes?: number;
}

export interface CategoryTemplateSeed {
  name: string;
  icon: string;
  description: string;
  displayOrder: number;
  tasks: TaskTemplateSeed[];
}

export const TEMPLATE_SEED_DATA: CategoryTemplateSeed[] = [
  {
    name: 'Estructura',
    icon: '🏗',
    description: 'Control estructural de la vivienda',
    displayOrder: 0,
    tasks: [
      {
        name: 'Inspección visual de vigas y columnas',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar visualmente vigas y columnas en busca de fisuras, deformaciones o manchas de humedad. Verificar que no haya desprendimientos de material.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Control de fisuras en muros',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Examinar muros interiores y exteriores buscando fisuras nuevas o crecimiento de existentes. Marcar con cinta y fotografiar para seguimiento.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 45,
      },
      {
        name: 'Evaluación profesional de fundaciones',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Evaluación técnica de cimientos y fundaciones por profesional matriculado. Incluye nivel de asentamientos y estado general.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 120,
      },
      {
        name: 'Verificación de juntas de dilatación',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Inspeccionar el estado de las juntas de dilatación en losas y muros. Verificar sellado y flexibilidad del material.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Reparación de fisuras detectadas',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Reparar fisuras detectadas en inspecciones previas. Aplicar sellador o mortero según corresponda al tipo de fisura.',
        priority: 'HIGH',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
      },
    ],
  },
  {
    name: 'Techos y Cubiertas',
    icon: '🏠',
    description: 'Mantenimiento de techos, membranas y desagües pluviales',
    displayOrder: 1,
    tasks: [
      {
        name: 'Inspección de membrana hidrófuga',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar estado de la membrana asfáltica o hidrófuga en techos planos. Buscar burbujas, grietas o despegues en uniones.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 40,
      },
      {
        name: 'Limpieza de canaletas y bajadas pluviales',
        taskType: 'CLEANING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Limpiar hojas, tierra y sedimentos de canaletas y verificar libre circulación de bajadas pluviales. Probar con agua.',
        priority: 'HIGH',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 45,
      },
      {
        name: 'Control de tejas o chapa',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de tejas (rotas, desplazadas) o chapas (oxidación, tornillos flojos). Controlar sellado en cumbrera.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Tratamiento impermeabilizante',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Aplicar tratamiento impermeabilizante en terraza o techo plano. Incluye limpieza previa y aplicación de producto protector.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 180,
      },
      {
        name: 'Reparación de filtraciones',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Detectar y reparar filtraciones activas en techos. Requiere identificación del punto de ingreso y sellado profesional.',
        priority: 'URGENT',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 120,
      },
    ],
  },
  {
    name: 'Instalación Eléctrica',
    icon: '⚡',
    description: 'Seguridad eléctrica, tablero y protecciones',
    displayOrder: 2,
    tasks: [
      {
        name: 'Prueba de disyuntor diferencial (ID)',
        taskType: 'TEST',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Presionar botón de test del interruptor diferencial. Debe cortar el suministro inmediatamente. Si no corta, llamar a electricista.',
        priority: 'URGENT',
        recurrenceType: 'MONTHLY',
        recurrenceMonths: 1,
        estimatedDurationMinutes: 5,
      },
      {
        name: 'Inspección de tablero eléctrico',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Revisar estado del tablero: térmicas, conexiones, cables sueltos, signos de recalentamiento. Verificar identificación de circuitos.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Medición de puesta a tierra',
        taskType: 'MEASUREMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Medir resistencia de puesta a tierra con telurímetro. Valor debe ser menor a 10 ohms según reglamentación AEA.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
      },
      {
        name: 'Control de tomacorrientes y llaves',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar que todos los tomacorrientes y llaves de luz funcionen correctamente. Buscar signos de chispas, calor o decoloración.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Revisión de instalación eléctrica completa',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Revisión completa de la instalación eléctrica por electricista matriculado. Incluye termografía y mediciones de aislación.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 36,
        estimatedDurationMinutes: 240,
      },
    ],
  },
  {
    name: 'Instalación Sanitaria',
    icon: '🚿',
    description: 'Plomería, desagües y agua corriente',
    displayOrder: 3,
    tasks: [
      {
        name: 'Inspección de canillas y griferías',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar que no haya goteos en canillas de cocina, baños y lavadero. Revisar estado de las juntas y aireadores.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 20,
      },
      {
        name: 'Limpieza de sifones y rejillas',
        taskType: 'CLEANING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Desarmar y limpiar sifones de piletas. Retirar residuos de rejillas de piso. Verificar buen escurrimiento del agua.',
        priority: 'MEDIUM',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Control de tanque de agua',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Inspeccionar tanque de reserva: nivel de agua, estado de flotante, tapa bien colocada, limpieza interna si corresponde.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Limpieza y desinfección de tanque',
        taskType: 'CLEANING',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Vaciar tanque, cepillar paredes interiores, enjuagar y desinfectar con lavandina diluida. Dejar secar antes de llenar.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 120,
      },
      {
        name: 'Detección de pérdidas ocultas',
        taskType: 'TEST',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Cerrar todas las canillas, verificar que el medidor de agua no siga girando. Si gira, hay una pérdida oculta. Llamar a plomero.',
        priority: 'MEDIUM',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 10,
      },
    ],
  },
  {
    name: 'Gas y Calefacción',
    icon: '🔥',
    description: 'Instalación de gas, calefacción y agua caliente',
    displayOrder: 4,
    tasks: [
      {
        name: 'Revisión de artefactos de gas',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificación de funcionamiento seguro de calefones, estufas, hornos y calefactores. Control de combustión y ventilación.',
        priority: 'URGENT',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
      },
      {
        name: 'Control de llama piloto y quemadores',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar que la llama de quemadores sea azul y estable. Llama amarilla o irregular indica mala combustión. Ventilar y llamar gasista.',
        priority: 'HIGH',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 10,
      },
      {
        name: 'Prueba de monóxido de carbono',
        taskType: 'TEST',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Medición de niveles de CO con detector certificado en ambientes con artefactos de gas. Verificar ventilaciones y tirajes.',
        priority: 'URGENT',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
      },
      {
        name: 'Limpieza de conductos de ventilación',
        taskType: 'CLEANING',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Limpiar rejillas de ventilación y verificar que los conductos de tiraje estén libres de obstrucciones.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
      },
      {
        name: 'Service de caldera/calefón',
        taskType: 'ADJUSTMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Servicio técnico completo del calefón o caldera: limpieza de intercambiador, revisión de válvulas, ajuste de presión.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 90,
      },
    ],
  },
  {
    name: 'Aberturas',
    icon: '🚪',
    description: 'Puertas, ventanas, cerraduras y herrajes',
    displayOrder: 5,
    tasks: [
      {
        name: 'Lubricación de bisagras y cerraduras',
        taskType: 'LUBRICATION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Aplicar lubricante en aerosol o grafito en todas las bisagras de puertas y cerraduras. Verificar libre movimiento.',
        priority: 'LOW',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Ajuste de burletes y sellados',
        taskType: 'ADJUSTMENT',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar y reemplazar burletes deteriorados en ventanas y puertas exteriores. Controlar sellado perimetral.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
      },
      {
        name: 'Inspección de marcos y premarcos',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de marcos de madera (humedad, hongos), aluminio (oxidación) o PVC (deformación). Buscar separaciones del muro.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Control de vidrios y masillas',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar vidrios en busca de rajaduras y verificar estado de masillas o selladores. Reemplazar los deteriorados.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
      },
      {
        name: 'Tratamiento de marcos de madera',
        taskType: 'TREATMENT',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Aplicar protector, barniz o pintura a marcos de madera expuestos a intemperie. Lijar previamente si hay descascaramiento.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 120,
      },
    ],
  },
  {
    name: 'Pintura y Revestimientos',
    icon: '🎨',
    description: 'Pintura interior/exterior, revoques y revestimientos',
    displayOrder: 6,
    tasks: [
      {
        name: 'Inspección de pintura exterior',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar fachadas y muros exteriores: descascaramiento, ampollas, manchas de humedad, hongos o eflorescencias.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Control de humedad en muros interiores',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Buscar manchas de humedad, moho o desprendimiento de pintura en paredes interiores, especialmente en baños y cocina.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 20,
      },
      {
        name: 'Tratamiento anti-humedad',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Aplicar tratamiento hidrófugo o anti-humedad en zonas afectadas. Incluye preparación de superficie y aplicación de producto.',
        priority: 'HIGH',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 120,
      },
      {
        name: 'Inspección de revestimientos cerámicos',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar adhesión de cerámicos en baños y cocina golpeando suavemente. Sonido hueco indica despegue. Revisar juntas.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
      },
      {
        name: 'Sellado de juntas en áreas húmedas',
        taskType: 'SEALING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Renovar sellado de silicona en uniones de bañera, ducha, piletas y mesadas. Remover silicona vieja antes de aplicar nueva.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
      },
    ],
  },
  {
    name: 'Jardín y Exteriores',
    icon: '🌳',
    description: 'Espacios exteriores, veredas, medianeras y jardín',
    displayOrder: 7,
    tasks: [
      {
        name: 'Inspección de veredas y senderos',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar estado de veredas y senderos: baldosas flojas, grietas, desniveles peligrosos, crecimiento de raíces.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 20,
      },
      {
        name: 'Control de medianeras y cercos',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Inspeccionar medianeras: fisuras, inclinación, humedad. Verificar estado de cercos perimetrales y portones.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Limpieza de desagües exteriores',
        taskType: 'CLEANING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Limpiar rejillas de desagüe pluvial, cunetas y canaletas exteriores. Verificar pendiente correcta hacia desagüe.',
        priority: 'HIGH',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Control de pileta de natación',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado del vaso, revestimiento, equipos de filtrado y niveles de químicos. Inspeccionar bordes y coping.',
        priority: 'MEDIUM',
        recurrenceType: 'MONTHLY',
        recurrenceMonths: 1,
        estimatedDurationMinutes: 30,
      },
      {
        name: 'Poda de árboles cercanos a la estructura',
        taskType: 'ADJUSTMENT',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Podar ramas que estén en contacto o próximas a techos, cables o canaletas. Previene daños por tormentas.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 120,
      },
    ],
  },
  {
    name: 'Climatización',
    icon: '❄️',
    description: 'Aire acondicionado, ventilación y confort térmico',
    displayOrder: 8,
    tasks: [
      {
        name: 'Limpieza de filtros de aire acondicionado',
        taskType: 'CLEANING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Retirar y lavar filtros de cada split con agua y jabón neutro. Dejar secar completamente antes de reinstalar.',
        priority: 'HIGH',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 20,
      },
      {
        name: 'Service de aire acondicionado',
        taskType: 'ADJUSTMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Servicio técnico completo: limpieza de evaporador y condensador, verificación de gas refrigerante, control eléctrico.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 90,
      },
      {
        name: 'Inspección de unidad exterior',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar que la unidad exterior no tenga obstrucciones, que las aletas no estén dobladas y que drene correctamente.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 15,
      },
      {
        name: 'Control de ventilación natural',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar que las rejillas de ventilación natural estén libres de obstrucciones. Son obligatorias en ambientes con gas.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 10,
      },
      {
        name: 'Evaluación de aislación térmica',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Evaluación del estado de aislación térmica en techos y muros. Identificar puentes térmicos y recomendar mejoras.',
        priority: 'LOW',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 36,
        estimatedDurationMinutes: 120,
      },
    ],
  },
];
