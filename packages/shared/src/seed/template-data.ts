import type {
  ProfessionalRequirement,
  PropertySector,
  RecurrenceType,
  TaskPriority,
  TaskType,
} from '../types/enums';

export interface TaskTemplateSeed {
  name: string;
  taskType: TaskType;
  professionalRequirement: ProfessionalRequirement;
  technicalDescription?: string;
  priority: TaskPriority;
  recurrenceType: RecurrenceType;
  recurrenceMonths: number;
  estimatedDurationMinutes?: number;
  defaultSector: PropertySector;
  inspectionGuide?: string;
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
          'Revisar visualmente vigas y columnas en busca de fisuras, deformaciones o manchas de humedad. Verificar que no haya desprendimientos de material. Buscar: fisuras diagonales (indican asentamiento), fisuras horizontales (empuje lateral), manchas blancas (eflorescencias por humedad), óxido en armaduras expuestas. ATENCIÓN si: fisura >2mm o crece entre visitas. PROFESIONAL si: fisura activa con desplazamiento, armadura expuesta u oxidada, deformación visible de elementos.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Fisuras diagonales en uniones viga-columna (indican asentamiento diferencial)
- Fisuras horizontales en columnas (empuje lateral o sobrecarga)
- Manchas blancas (eflorescencias = sales por humedad)
- Armadura expuesta u oxidada (corrosión del acero)
- Deformaciones visibles (pandeo, desplome)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin fisuras nuevas, sin manchas, estructura firme |
| ⚠️ Atención | Fisura <2mm, manchas leves, eflorescencias aisladas |
| 🔴 Profesional | Fisura >2mm activa, armadura oxidada, deformación |

## Tips de campo
- Usar linterna en zonas oscuras (subsuelo, entretecho)
- Fotografiar con referencia de escala (moneda o regla)
- Marcar fisuras con cinta adhesiva y fecha para seguimiento
- Golpear suavemente con nudillos: sonido hueco = desprendimiento`,
      },
      {
        name: 'Control de fisuras en muros',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Examinar muros interiores y exteriores buscando fisuras nuevas o crecimiento de existentes. Marcar con cinta y fotografiar para seguimiento. Clasificar: fisuras capilares (<0.5mm, estéticas), fisuras medias (0.5-2mm, monitorear), fisuras graves (>2mm, estructural). Buscar patrón: en diagonal = asentamiento, horizontal = empuje, en escalera = cedimiento de fundación. ATENCIÓN si: fisura nueva o que creció desde última visita. PROFESIONAL si: fisura >2mm, patrón en escalera, o acompañada de desnivel en pisos.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 45,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Fisuras nuevas o que crecieron desde la última visita
- Clasificar por ancho: capilares (<0.5mm), medias (0.5-2mm), graves (>2mm)
- Patrón: diagonal = asentamiento, horizontal = empuje, escalera = cedimiento

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin fisuras nuevas, las existentes no crecieron |
| ⚠️ Atención | Fisura nueva <2mm o existente que creció |
| 🔴 Profesional | Fisura >2mm, patrón en escalera, o con desplazamiento |

## Procedimiento
1. Marcar fisuras con cinta y fecha en visita anterior
2. Medir ancho con fisurómetro o regla milimetrada
3. Comparar con registro fotográfico anterior
4. Fotografiar con referencia de escala (moneda)

## Normativa
- CIRSOC 200 — estructuras de hormigón armado
- Código de Edificación CABA — sección estructura`,
      },
      {
        name: 'Evaluación profesional de fundaciones',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Inspección especializada de fundaciones y cimientos. Buscar en subsuelo: manchas de humedad ascendente en base de muros (línea horizontal a 30-50cm del suelo), eflorescencias blancas (sales por capilaridad), desprendimiento de revoque en zona baja, olor a humedad. En pisos: verificar nivelación con nivel de burbuja — desniveles >5mm en 2m indican movimiento. En muros: fisuras en escalera cerca de esquinas = asentamiento diferencial. SIEMPRE requiere profesional matriculado.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 120,
        defaultSector: 'BASEMENT',
        inspectionGuide: `## Qué buscar
- Manchas de humedad ascendente en base de muros (hasta 50cm)
- Eflorescencias blancas (sales por capilaridad)
- Desniveles en pisos (usar nivel de burbuja, >5mm en 2m es significativo)
- Fisuras en escalera cerca de esquinas = asentamiento diferencial
- Desprendimiento de revoque en zona baja de muros

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin signos de movimiento ni humedad ascendente |
| ⚠️ Atención | Humedad leve en base, eflorescencias aisladas |
| 🔴 Profesional | Desniveles, fisuras en escalera, asentamiento |

## Procedimiento
1. Verificar nivelación de pisos con nivel de burbuja
2. Recorrer base de muros interiores buscando manchas
3. En subsuelo: verificar muros y pisos
4. Fotografiar hallazgos con ubicación de referencia

## Importante
**SIEMPRE requiere profesional matriculado** para diagnóstico definitivo.

## Normativa
- CIRSOC 200 — fundaciones
- INTI — relevamiento técnico de patologías constructivas`,
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
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Sellado de juntas: que esté íntegro sin fisuras ni desprendimientos
- Material de relleno: no debe faltar ni estar deteriorado
- Que la junta permita movimiento (no debe estar rellena con mortero rígido)
- Filtración de agua por las juntas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sellado íntegro, sin filtraciones |
| ⚠️ Atención | Sellado parcialmente deteriorado |
| 🔴 Profesional | Sellado ausente, filtración activa, junta trabada con mortero |

## Procedimiento
1. Localizar todas las juntas de dilatación visibles
2. Verificar integridad del sellado en todo el recorrido
3. Buscar manchas de humedad adyacentes (indican filtración)

## Normativa
- CIRSOC 200 — juntas de dilatación en estructuras de hormigón
- Código de Edificación CABA`,
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
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Fisuras previamente marcadas que requieren intervención
- Evaluar si la fisura está activa (sigue creciendo) o estabilizada
- Estado del material circundante

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Fisura estabilizada, reparación cosmética suficiente |
| ⚠️ Atención | Fisura estabilizada pero requiere sellado preventivo |
| 🔴 Profesional | Fisura activa, requiere inyección epoxi o refuerzo estructural |

## Procedimiento
1. Verificar marcas de la visita anterior (cinta con fecha)
2. Medir si el ancho cambió
3. Para fisuras estabilizadas <2mm: sellador elástico
4. Para fisuras activas o >2mm: derivar a profesional

## Normativa
- INTI — protocolos de reparación de patologías constructivas`,
      },
      {
        name: 'Control de humedad ascendente en cimientos',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Buscar manchas de humedad en la base de muros interiores y exteriores hasta ~1m de altura. Signos: pintura ampollada, revoque que se desprende, eflorescencias blancas (sales), olor a humedad, moho. Medir con hidrómetro de contacto si disponible. Verificar: si hay capa aisladora horizontal (barrera contra humedad ascendente por capilaridad), si los zócalos están dañados, si el terreno exterior tiene pendiente hacia la casa (debe ser al revés). ATENCIÓN si: manchas nuevas o en expansión. PROFESIONAL si: humedad en más de 2 muros, daño estructural en revoque, o sospecha de capa aisladora ausente/dañada.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
        defaultSector: 'BASEMENT',
      },
      {
        name: 'Evaluación estructural integral quinquenal',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Evaluación completa del estado estructural por ingeniero matriculado. Incluye fundaciones, losas, vigas, columnas y muros portantes.',
        priority: 'HIGH',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 60,
        estimatedDurationMinutes: 240,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Estado general de todos los elementos estructurales
- Vigas, columnas, losas, muros portantes, fundaciones
- Signos de corrosión de armaduras, carbonatación del hormigón
- Deformaciones, desplomes, pandeos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin deterioro significativo en 5 años |
| ⚠️ Atención | Deterioro leve que requiere monitoreo cercano |
| 🔴 Profesional | Cualquier signo de compromiso estructural |

## Importante
**SIEMPRE requiere ingeniero estructural matriculado.** Esta evaluación es una revisión integral, no una inspección visual rutinaria.

## Normativa
- CIRSOC 200 — evaluación de estructuras existentes
- Código de Edificación CABA — mantenimiento estructural`,
      },
      {
        name: 'Inspección de losa de hormigón armado',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Revisar losas macizas o de viguetas pretensadas buscando fisuras de flexión, retracción o armaduras expuestas/oxidadas. Verificar desprendimientos de recubrimiento.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Fisuras en cara inferior (cielorraso): mapa de fisuras, patrón
- Manchas de óxido (indican corrosión de armaduras)
- Flechas excesivas (deformación visible, hundimiento central)
- Desprendimiento de recubrimiento (capa de hormigón sobre armadura)
- Humedad o goteo a través de la losa

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin fisuras significativas, sin manchas de óxido |
| ⚠️ Atención | Fisuras finas sin óxido, humedad leve |
| 🔴 Profesional | Manchas de óxido, armadura expuesta, flecha excesiva |

## Procedimiento
1. Inspeccionar cara inferior con buena iluminación
2. Buscar manchas marrones/anaranjadas (óxido de armadura)
3. Verificar planeidad visual (comparar con líneas de referencia)
4. Golpear suavemente: sonido hueco = desprendimiento

## Normativa
- CIRSOC 200 — evaluación de losas de hormigón`,
      },
      {
        name: 'Control de revoques exteriores',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar adherencia del revoque golpeando con nudillos (sonido hueco indica desprendimiento). Buscar fisuras mapa, ampollas y desprendimientos en muros de ladrillo hueco con revoque cementicio.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Desprendimientos o zonas huecas (golpear con nudillos)
- Fisuras en el revoque (mapa de fisuras)
- Manchas de humedad, eflorescencias, moho
- Ampollas o descascaramiento de pintura sobre revoque

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Revoque firme, sin fisuras ni desprendimientos |
| ⚠️ Atención | Fisuras capilares, descascaramiento leve de pintura |
| 🔴 Profesional | Zonas huecas extensas, desprendimiento activo |

## Procedimiento
1. Golpear suavemente toda la superficie con nudillos
2. Sonido hueco = revoque desprendido del muro
3. Verificar bordes de fisuras (si se mueven = activas)
4. Registrar extensión de áreas afectadas

## Normativa
- Código de Edificación CABA — mantenimiento de fachadas`,
      },
      {
        name: 'Inspección de muros portantes de mampostería',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar aplomo de muros, buscar fisuras diagonales (indican asentamientos diferenciales), evaluar estado de juntas de mortero. Específico de construcción con ladrillo común o hueco.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 60,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Fisuras verticales u horizontales en muros de ladrillo
- Estado de las juntas de mortero (desgaste, faltante)
- Desplome del muro (verificar con plomada o nivel)
- Humedad, eflorescencias, daño por sales

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Muro aplomado, juntas íntegras, sin fisuras |
| ⚠️ Atención | Juntas desgastadas, fisuras menores |
| 🔴 Profesional | Muro desplomado, fisuras en escalera, juntas faltantes |

## Procedimiento
1. Verificar aplomo con nivel o plomada
2. Inspeccionar juntas de mortero (desgaste >10mm = rejuntar)
3. Buscar fisuras siguiendo patrón de juntas (escalera)
4. Verificar encadenados horizontales visibles

## Normativa
- CIRSOC 501 — mampostería encadenada
- Código de Edificación CABA — muros portantes`,
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
          'Subir al techo y revisar la membrana asfáltica o hidrófuga. Buscar: burbujas (delaminación), fisuras en la superficie, bordes despegados, zonas donde se acumula agua (falta de pendiente), vegetación creciendo sobre la membrana (raíces perforando). Verificar solapes entre paños (mínimo 10cm). En membrana asfáltica: tocar y verificar si está reseca y quebradiza (fin de vida útil ~10 años). ATENCIÓN si: burbujas o fisuras superficiales. PROFESIONAL si: zona con agua estancada, membrana quebradiza, o filtración activa visible desde adentro.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 40,
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Burbujas en la superficie (delaminación)
- Fisuras o grietas (especialmente en bordes y solapes)
- Zonas con agua estancada (falta de pendiente)
- Vegetación creciendo sobre la membrana (raíces perforan)
- Bordes despegados en perímetro y encuentros con muros
- Estado general: flexible vs reseca/quebradiza

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Membrana íntegra, sin agua estancada, bordes sellados |
| ⚠️ Atención | Burbujas aisladas, fisuras superficiales |
| 🔴 Profesional | Membrana quebradiza, filtración activa, agua estancada |

## Procedimiento
1. Subir al techo con precaución (calzado antideslizante)
2. Recorrer toda la superficie buscando anomalías
3. Verificar solapes entre paños (mínimo 10cm de sobreposición)
4. Tocar la membrana: debe ser flexible, no quebradiza
5. Verificar encuentros con muros, chimeneas, ventilaciones
6. Fotografiar hallazgos con referencia de ubicación

## Vida útil
- Membrana asfáltica: ~10 años (según exposición solar)
- Membrana líquida: ~5-7 años
- Si está reseca y se quiebra al doblar → fin de vida útil`,
      },
      {
        name: 'Limpieza de canaletas y bajadas pluviales',
        taskType: 'CLEANING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Limpiar hojas, tierra y sedimentos de canaletas y verificar libre circulación de bajadas pluviales. Probar vertiendo agua con balde. Verificar: pendiente correcta (el agua debe escurrir sin estancarse), uniones selladas (buscar goteos debajo), soportes firmes (la canaleta no debe pandearse), rejillas de protección contra hojas. En bajadas: verificar que no estén obstruidas pasando agua y escuchando el flujo. ATENCIÓN si: pendiente invertida o goteo en uniones. PROFESIONAL si: canaleta con deformación o soportes cedidos.',
        priority: 'HIGH',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 45,
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Acumulación de hojas, tierra y sedimentos en canaletas
- Bajadas obstruidas (verificar pasando agua)
- Pendiente correcta (el agua debe escurrir sin estancarse)
- Uniones selladas (goteos debajo de canaleta)
- Soportes firmes (deformación o pandeo de canaleta)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Canaletas limpias, pendiente correcta, sin goteos |
| ⚠️ Atención | Acumulación leve, necesita limpieza |
| 🔴 Profesional | Pendiente invertida, soportes cedidos, deformación |

## Procedimiento
1. Retirar hojas y sedimentos manualmente con guantes
2. Pasar agua con balde y verificar que escurra sin estancarse
3. Verificar bajadas: escuchar flujo al verter agua arriba
4. Revisar sellado en uniones y esquinas
5. Verificar estado de rejillas protectoras

## Normativa
- Código de Edificación CABA — desagües pluviales`,
      },
      {
        name: 'Control de tejas o chapa',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de tejas (rotas, desplazadas) o chapas (oxidación, tornillos flojos). Controlar sellado en cumbrera. Revisar antes y después de temporada de lluvias.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Tejas: rotas, desplazadas, faltantes, con musgo
- Chapa: oxidación, tornillos flojos o faltantes, ondulación
- Sellado en cumbrera (el punto más vulnerable)
- Solapes entre piezas (mínimo según fabricante)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cubierta íntegra, sin tejas rotas ni chapa oxidada |
| ⚠️ Atención | 1-2 tejas desplazadas, oxidación superficial en chapa |
| 🔴 Profesional | Múltiples tejas rotas, chapa perforada, filtración activa |

## Procedimiento
1. Inspección visual desde escalera o terraza (NO caminar sobre tejas)
2. Usar binoculares si la cubierta no es accesible
3. Verificar cumbrera y babetas en encuentros con muros
4. En chapa: buscar zonas con burbujas de óxido

## Normativa
- Código de Edificación CABA — cubiertas`,
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
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Estado de la impermeabilización actual (membrana, pintura, líquida)
- Adherencia al sustrato (bordes despegados)
- Fisuras o burbujas en el tratamiento
- Zonas donde el tratamiento ya perdió efectividad

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Impermeabilización íntegra y adherida |
| ⚠️ Atención | Desgaste superficial, requiere renovación preventiva |
| 🔴 Profesional | Tratamiento fallido, filtración activa |

## Procedimiento
1. Recorrer toda la superficie tratada
2. Verificar bordes y encuentros con muros
3. Buscar burbujas, fisuras, zonas despegadas
4. Verificar fecha del último tratamiento (vida útil ~5-10 años)

## Nota
Se recomienda profesional para la aplicación del tratamiento.`,
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
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Origen de la filtración (rastrear desde mancha interior hasta cubierta)
- Manchas en cielorraso: amarillas (agua), verdes (moho)
- Goteo activo durante o después de lluvia
- Estado del sellado en encuentros, babetas, chimeneas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin manchas ni goteos |
| ⚠️ Atención | Mancha seca antigua, no activa |
| 🔴 Profesional | Filtración activa, goteo, moho |

## Procedimiento
1. Identificar la zona de mancha en interior
2. Subir al techo y buscar el origen arriba de la mancha
3. Verificar: membrana, babetas, canaletas, encuentros con muros
4. Marcar el punto de origen para reparación

## Importante
Las filtraciones activas requieren reparación urgente para evitar daño estructural.`,
      },
      {
        name: 'Reemplazo integral de membrana asfáltica',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Reemplazo completo de membrana asfáltica en techos planos. Incluye retiro de membrana vieja, preparación de superficie y colocación nueva.',
        priority: 'HIGH',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 120,
        estimatedDurationMinutes: 480,
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Estado general de la membrana: flexible o reseca/quebradiza
- Fecha de la última aplicación (vida útil ~10 años)
- Solapes entre paños (mínimo 10cm)
- Adherencia al sustrato

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Membrana flexible, sin fisuras, dentro de vida útil |
| ⚠️ Atención | Más de 8 años, desgaste visible |
| 🔴 Profesional | Quebradiza, múltiples fisuras, vida útil excedida |

## Importante
**SIEMPRE requiere profesional** para el reemplazo. La aplicación con soplete de gas requiere habilitación.

## Normativa
- Práctica profesional: membrana asfáltica vida útil 10 años`,
      },
      {
        name: 'Inspección post-granizo',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Tras tormentas de granizo: verificar daños en membrana, tejas rotas, chapas abolladas, canaletas dañadas. Documentar con fotos para reclamo de seguro.',
        priority: 'HIGH',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 40,
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Tejas rotas o fisuradas por impacto
- Abolladura en chapa
- Daño en membrana (perforaciones)
- Canaletas deformadas
- Claraboyas o lucernarios dañados

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin daños visibles tras el evento |
| ⚠️ Atención | Daño menor (1-2 tejas fisuradas) |
| 🔴 Profesional | Daño extenso, perforación de cubierta |

## Procedimiento
1. Inspeccionar lo antes posible después del evento
2. Documentar fotográficamente todos los daños (para seguro)
3. Verificar interior: buscar goteos nuevos
4. Revisar canaletas y bajadas por obstrucción con granizo`,
      },
      {
        name: 'Control de claraboyas y lucernarios',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar sellado perimetral, estado de policarbonato o vidrio, bisagras si es abatible. Las juntas se resecan con el calor y pierden hermeticidad.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Estado del vidrio o policarbonato (fisuras, amarillamiento)
- Sellado perimetral (silicona o burlete)
- Oxidación en marcos metálicos
- Condensación interior (indica pérdida de hermeticidad)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Vidrio íntegro, sellado hermético, sin condensación |
| ⚠️ Atención | Sellado deteriorado, condensación leve |
| 🔴 Profesional | Vidrio fisurado, filtración activa |

## Procedimiento
1. Verificar estado de vidrio/policarbonato visualmente
2. Revisar sellado perimetral completo
3. Buscar marcas de agua o humedad alrededor
4. Verificar mecanismo de apertura si es practicable`,
      },
      {
        name: 'Limpieza de techos y terrazas',
        taskType: 'CLEANING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Barrer hojas, tierra acumulada y vegetación parasitaria (musgos, líquenes). La acumulación retiene humedad y deteriora membranas. Especialmente en clima húmedo del Litoral.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 45,
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Acumulación de suciedad, hojas, musgo
- Desagües y rejillas obstruidos
- Estado de la superficie (membrana, baldosas, contrapiso)
- Pendiente hacia los desagües (no debe haber charcos)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Limpio, desagües libres, sin charcos |
| ⚠️ Atención | Acumulación de suciedad, limpieza necesaria |
| 🔴 Profesional | Desagüe obstruido con agua estancada, musgo extenso |

## Procedimiento
1. Barrer hojas y residuos sueltos
2. Limpiar rejillas de desagüe
3. Verificar que el agua escurra hacia los desagües
4. Si hay musgo: limpiar con agua y cepillo (no ácidos)`,
      },
      {
        name: 'Revisión de babetas y encuentros',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar sellado en babetas (unión de pared con techo), encuentros con chimeneas, conductos de ventilación y antenas. Son puntos críticos de filtración.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'ROOF',
        inspectionGuide: `## Qué buscar
- Babetas (chapa o membrana) en encuentros techo-muro
- Sellado en chimeneas, ventilaciones, caños que atraviesan la cubierta
- Corrosión en babetas metálicas
- Desprendimiento o levantamiento

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Babetas selladas, sin oxidación ni levantamientos |
| ⚠️ Atención | Sellado parcialmente deteriorado |
| 🔴 Profesional | Babeta levantada, filtración en encuentro |

## Procedimiento
1. Verificar cada encuentro techo-muro
2. Revisar alrededor de chimeneas y ventilaciones
3. Buscar manchas de óxido o cal debajo de babetas
4. Verificar sellado con silicona o asfalto

## Normativa
- Código de Edificación CABA — encuentros de cubierta`,
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
          'Presionar el botón de TEST (marcado con T) en el interruptor diferencial del tablero. El diferencial debe cortar instantáneamente. Si no corta: la protección no funciona y hay riesgo de electrocución. Verificar: que haya al menos 1 diferencial de 30mA (obligatorio según AEA), que proteja todos los circuitos, que la palanca vuelva a posición ON fácilmente después del test. Repetir con cada diferencial si hay más de uno. ATENCIÓN si: demora en cortar (>0.3s). PROFESIONAL URGENTE si: no corta o no tiene diferencial instalado.',
        priority: 'URGENT',
        recurrenceType: 'MONTHLY',
        recurrenceMonths: 1,
        estimatedDurationMinutes: 5,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Funcionamiento del botón TEST del diferencial
- Corte inmediato del suministro al presionar TEST
- Que la palanca vuelva a ON fácilmente

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Corta inmediatamente al presionar TEST |
| ⚠️ Atención | Demora en cortar (>0.3 segundos) |
| 🔴 Profesional URGENTE | No corta, no tiene diferencial, o palanca trabada |

## Procedimiento
1. Avisar a los ocupantes que se cortará la luz momentáneamente
2. Presionar botón TEST (marcado con T)
3. El diferencial debe cortar instantáneamente
4. Volver a subir la palanca a posición ON
5. Repetir con cada diferencial si hay más de uno

## Importante
Hacer esta prueba **mensualmente**. Es la protección contra electrocución.

## Normativa
- AEA 90364 — protección diferencial obligatoria
- Diferencial 30mA mínimo según ENRE`,
      },
      {
        name: 'Inspección de tablero eléctrico',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Abrir la tapa del tablero principal y verificar: que las térmicas correspondan a los circuitos protegidos, que no haya cables sueltos o mal ajustados, que no haya signos de calentamiento (cables oscurecidos, plástico deformado, olor a quemado). Verificar: etiquetado de circuitos, que los bornes estén ajustados (no girar), que el gabinete esté limpio y seco. Buscar: signos de arco eléctrico (marcas negras), cables con aislación deteriorada, empalmes fuera de borneras. ATENCIÓN si: etiquetado faltante o cables flojos. PROFESIONAL si: signos de calentamiento, cables sin aislación, o tablero subdimensionado.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Térmicas correctas por circuito (no puenteadas)
- Diferencial presente y funcional (30mA mínimo, norma AEA)
- Cables con aislación íntegra (sin derretir, sin oscurecer)
- Bornes ajustados (no girar, verificar visualmente)
- Signos de calentamiento: plástico deformado, olor a quemado
- Etiquetado de circuitos legible

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Tablero limpio, etiquetado, sin signos de calor |
| ⚠️ Atención | Etiquetas faltantes, cable flojo visible |
| 🔴 Profesional | Signos de arco eléctrico, cables sin aislación, sin diferencial |

## Procedimiento
1. Abrir tapa del tablero (NO tocar cables internos)
2. Verificar visualmente estado general
3. Contar circuitos vs protecciones
4. Presionar botón TEST del diferencial (debe cortar)
5. Fotografiar el tablero completo

## Normativa
- Norma AEA 90364 — instalaciones eléctricas en inmuebles
- Diferencial 30mA obligatorio según ENRE`,
      },
      {
        name: 'Medición de puesta a tierra',
        taskType: 'MEASUREMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Medir resistencia de puesta a tierra con telurímetro. Valor debe ser menor a 10 ohms según reglamentación AEA (máximo 40 ohms para diferencial de 30mA). Verificar: que exista jabalina de PAT visible y accesible, que el conductor de protección (cable verde-amarillo) llegue al tablero, que todas las masas metálicas estén conectadas (canillas, marcos metálicos, artefactos). ATENCIÓN si: valor entre 10-40 ohms. PROFESIONAL si: valor >40 ohms, jabalina ausente, o conductor cortado.',
        priority: 'HIGH',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 60,
        estimatedDurationMinutes: 45,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Valor de resistencia de puesta a tierra (PAT)
- Estado de la jabalina y conductor de protección
- Conexión del cable verde-amarillo al tablero

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | PAT <10 ohms, jabalina y conductor en buen estado |
| ⚠️ Atención | PAT entre 10-40 ohms |
| 🔴 Profesional | PAT >40 ohms, jabalina ausente, conductor cortado |

## Importante
**Requiere electricista matriculado con telurímetro.**

## Normativa
- AEA 90364 parte 5 cap. 54 — instalaciones de PAT
- IRAM 2281 — medición de resistencia de PAT
- ENRE: máximo 40 ohms para diferencial 30mA`,
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
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Tomacorrientes flojos o que no sujetan la ficha
- Marcas de calentamiento (oscurecimiento, deformación)
- Llaves de luz que chispean o hacen ruido al accionar
- Tapas rotas o faltantes
- Tomacorrientes cerca de agua sin protección (baño, cocina)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos firmes, sin marcas de calor, funcionan correctamente |
| ⚠️ Atención | Tapa rota, tomacorriente flojo |
| 🔴 Profesional | Signos de calentamiento, chispas, olor a quemado |

## Procedimiento
1. Verificar cada tomacorriente insertando y retirando una ficha
2. Accionar cada llave de luz: escuchar chispas o crepiteo
3. Verificar que tomacorrientes en baño/cocina sean con toma tierra
4. Buscar oscurecimiento alrededor de tapas (signo de arco)

## Normativa
- AEA 90364 sección 771 — instalaciones en viviendas`,
      },
      {
        name: 'Revisión de instalación eléctrica completa',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Revisión completa de la instalación eléctrica por electricista matriculado. Incluye termografía y mediciones de aislación. Frecuencia recomendada por ENRE: cada 5 años.',
        priority: 'HIGH',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 60,
        estimatedDurationMinutes: 240,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Estado general de tablero, cableado visible, tomacorrientes
- Termografía de puntos calientes (si hay instrumental)
- Cables con aislación deteriorada
- Circuitos sobrecargados

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Instalación en buen estado general |
| ⚠️ Atención | Cables antiguos pero funcionales, tablero desactualizado |
| 🔴 Profesional | Cables sin aislación, tablero sin diferencial, empalmes fuera de caja |

## Importante
**Requiere electricista matriculado.** Frecuencia recomendada por ENRE: cada 5 años.

## Normativa
- AEA 90364 — reglamentación completa
- ENRE — revisión cada 5 años recomendada`,
      },
      {
        name: 'Medición de aislación de conductores (megado)',
        taskType: 'MEASUREMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Medir resistencia de aislación con megóhmetro en circuitos principales. Cables envejecidos con aislación reseca son riesgo de incendio. Norma AEA 90364. Se realiza junto con la revisión eléctrica completa cada 5 años.',
        priority: 'HIGH',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 60,
        estimatedDurationMinutes: 60,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Resistencia de aislación de conductores con megóhmetro
- Cables envejecidos con aislación reseca = riesgo de incendio
- Valores mínimos según norma AEA

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Valores de aislación dentro de norma |
| ⚠️ Atención | Valores límite, monitorear en próxima revisión |
| 🔴 Profesional | Valores por debajo de norma, reemplazo de cables |

## Importante
**Requiere electricista matriculado con megóhmetro.** Se realiza junto con la revisión eléctrica completa cada 5 años.

## Normativa
- AEA 90364 — valores mínimos de aislación
- Norma IRAM correspondiente`,
      },
      {
        name: 'Verificación de protecciones térmicas por circuito',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar que cada térmica proteja un circuito individual. Verificar calibre correcto según sección de cable. Norma AEA 90364.',
        priority: 'HIGH',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 36,
        estimatedDurationMinutes: 45,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Que cada circuito tenga su térmica individual
- Que el amperaje de la térmica corresponda al cableado
- Que no haya térmicas puenteadas o anuladas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cada circuito protegido, amperajes correctos |
| ⚠️ Atención | Etiquetado faltante, difícil identificar circuitos |
| 🔴 Profesional | Térmicas puenteadas, amperaje excesivo para el cable |

## Procedimiento
1. Abrir tablero y contar térmicas vs circuitos
2. Verificar que ninguna térmica esté puenteada con alambre
3. Comparar amperaje de térmica con sección del cable

## Normativa
- AEA 90364 — protecciones por circuito`,
      },
      {
        name: 'Control de medidor eléctrico y acometida',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Inspeccionar estado del medidor, cables de acometida, caja de toma. Verificar que el precinto esté intacto. Reportar anomalías a la distribuidora.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 15,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Estado del gabinete del medidor (herrumbre, humedad)
- Cables de acometida (aislación, fijación)
- Sello del medidor intacto
- Tablero de acometida: térmica general

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Gabinete en buen estado, cables firmes |
| ⚠️ Atención | Gabinete con oxidación leve |
| 🔴 Profesional | Cables de acometida deteriorados, gabinete abierto |

## Procedimiento
1. Verificar gabinete externo del medidor
2. NO abrir el gabinete si tiene sello de la distribuidora
3. Verificar que no haya cables expuestos en acometida

## Normativa
- ENRE — reglamento de conexión de suministros`,
      },
      {
        name: 'Verificación de protección contra sobretensiones (DPS)',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Controlar si existe dispositivo de protección contra sobretensiones en tablero. Fundamental en zonas con tormentas eléctricas frecuentes. Norma AEA 90364-4-443.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Presencia de dispositivo DPS en tablero
- Indicador de estado (LED verde = OK, rojo = agotado)
- Conexión correcta entre fases y tierra

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | DPS presente y con indicador verde |
| ⚠️ Atención | DPS ausente (recomendado pero no obligatorio) |
| 🔴 Profesional | DPS con indicador rojo (agotado, reemplazar) |

## Nota
El DPS protege equipos electrónicos contra sobretensiones por rayos o maniobras en la red. Recomendado en zonas con tormentas frecuentes.

## Normativa
- AEA 90364 — protección contra sobretensiones`,
      },
      {
        name: 'Inspección de instalación eléctrica enterrada',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Si existe canalización subterránea: verificar estado de caños, cámaras de inspección, sellados. Buscar ingreso de agua o raíces.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 45,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Tapas de registro accesibles y en buen estado
- Caños de PVC no aplastados ni fisurados (donde son visibles)
- Humedad en registros o cajas de paso enterradas
- Cables con marcas de deterioro en puntos de salida

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Registros accesibles, sin humedad |
| ⚠️ Atención | Tapa de registro trabada o deteriorada |
| 🔴 Profesional | Humedad dentro de registros, cables dañados |

## Procedimiento
1. Localizar tapas de registro en jardín/vereda
2. Abrir y verificar estado interior (humedad, cables)
3. No manipular cables, solo inspección visual

## Normativa
- AEA 90364 — canalizaciones enterradas`,
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
          'Verificar que no haya goteos en canillas de cocina, baños y lavadero. Revisar estado de cuerpos cerámicos, flexibles de conexión y llaves de paso. Abrir y cerrar cada canilla completamente: debe cortar el flujo sin goteo residual. Verificar debajo de mesadas y vanitorys: buscar manchas de humedad, goteo activo en flexibles, corrosión verde en conexiones de bronce. En monocomandos: verificar que la temperatura mezcle correctamente. ATENCIÓN si: goteo persistente o flexible con corrosión. PROFESIONAL si: pérdida en caño empotrado o llave de paso que no corta.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 20,
        defaultSector: 'BATHROOM',
        inspectionGuide: `## Qué buscar
- Goteos con la canilla cerrada
- Estado de cuerpos cerámicos (giro suave, sin juego)
- Flexibles de conexión (fecha, corrosión, deformación)
- Presión de agua adecuada al abrir

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin goteos, giro suave, presión normal |
| ⚠️ Atención | Goteo leve, flexible próximo a vencer |
| 🔴 Profesional | Pérdida en caño empotrado, llave de paso que no corta |

## Procedimiento
1. Abrir y cerrar cada canilla completamente
2. Verificar debajo de mesadas/vanitorys (buscar goteo)
3. Revisar flexibles: buscar fecha estampada
4. En monocomandos: verificar mezcla de temperatura

## Normativa
- Reglamento OSN/AySA — instalaciones sanitarias internas`,
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
        defaultSector: 'BATHROOM',
        inspectionGuide: `## Qué buscar
- Velocidad de desagote (debe ser rápida)
- Olores provenientes de desagües (sifón seco o roto)
- Rejillas obstruidas con cabello, jabón, sedimentos
- Estado del sifón (corrosión, fisuras)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Desagote rápido, sin olores |
| ⚠️ Atención | Desagote lento, necesita limpieza |
| 🔴 Profesional | Obstrucción total, olores persistentes, sifón roto |

## Procedimiento
1. Verter agua en cada desagüe y cronometrar
2. Retirar rejillas y limpiar residuos acumulados
3. En sifones accesibles: desenroscar y limpiar
4. Verificar que el sifón tenga agua (sello hidráulico)`,
      },
      {
        name: 'Control de tanque de agua',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado del tanque de reserva: tapa cerrada (previene contaminación), flotante funcionando (el tanque debe llenar y cortar), sin pérdidas visibles en uniones. Revisar soportes o base (corrosión en tanques metálicos). Verificar: nivel de agua correcto, ausencia de sedimentos u olor en el agua, estado de la boya y válvula. En tanques de fibrocemento antiguos: verificar fisuras (si contienen amianto, NO tocar — requiere profesional especializado). ATENCIÓN si: tapa rota o ausente, flotante no corta. PROFESIONAL si: tanque de fibrocemento con fisuras, o pérdida en base del tanque.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
        defaultSector: 'TERRACE',
        inspectionGuide: `## Qué buscar
- Tapa cerrada y en buen estado (previene contaminación)
- Flotante funcionando (debe llenar y cortar correctamente)
- Sin pérdidas en uniones y válvulas
- Estado del tanque: fisuras, corrosión, decoloración
- Soportes/base firmes (sin oxidación ni deformación)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Tapa cerrada, flotante funcional, sin pérdidas |
| ⚠️ Atención | Tapa deteriorada, flotante lento, sedimento visible |
| 🔴 Profesional | Tanque de fibrocemento con fisuras, pérdida en base |

## Procedimiento
1. Verificar acceso al tanque (escalera segura)
2. Abrir tapa y observar estado del agua (color, olor)
3. Verificar flotante: bajar boya manualmente y soltar
4. Inspeccionar exterior: buscar manchas de humedad o goteo
5. Verificar soportes en tanques elevados

## IMPORTANTE
- Tanques de fibrocemento antiguos pueden contener AMIANTO
- NO lijar, perforar ni romper tanques de fibrocemento
- Si tiene fisuras → reemplazar completo (profesional especializado)`,
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
        defaultSector: 'TERRACE',
        inspectionGuide: `## Qué buscar
- Sedimentos en el fondo del tanque
- Color y olor del agua (turbia = contaminación)
- Estado de la tapa (cerrada, sin fisuras)
- Fecha de última limpieza (obligatoria anual)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Agua clara, tanque limpio, limpieza reciente |
| ⚠️ Atención | Sedimento leve, limpieza hace >6 meses |
| 🔴 Profesional | Agua turbia/con olor, nunca se limpió, tapa rota |

## Procedimiento
1. Cerrar ingreso de agua al tanque
2. Vaciar parcialmente dejando ~20cm
3. Limpiar paredes y fondo con cepillo y agua con lavandina
4. Enjuagar varias veces y llenar nuevamente
5. Registrar fecha de limpieza

## Normativa
- ENRESS — limpieza obligatoria mínimo 1 vez por año
- Resolución provincial: análisis bacteriológico anual`,
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
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Manchas de humedad en paredes sin fuente visible
- Aumento inexplicable en factura de agua
- Sonido de agua corriendo con canillas cerradas
- Medidor de agua que gira con todo cerrado

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Medidor quieto con todo cerrado, sin manchas |
| ⚠️ Atención | Mancha de humedad nueva sin fuente obvia |
| 🔴 Profesional | Medidor gira con todo cerrado = pérdida oculta |

## Procedimiento
1. Cerrar todas las canillas y artefactos
2. Verificar medidor de agua: debe estar quieto
3. Si gira = hay pérdida en cañería
4. Buscar manchas de humedad en pisos y paredes
5. Derivar a plomero para localización con instrumental`,
      },
      {
        name: 'Verificación de termotanque y ánodo de sacrificio',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Inspeccionar estado del termotanque: verificar ánodo de sacrificio, válvula de seguridad, conexiones y ausencia de pérdidas. Reemplazar ánodo si está consumido.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Estado exterior del termotanque (corrosión, pérdidas)
- Funcionamiento del ánodo de sacrificio (protege contra corrosión)
- Temperatura del agua (no debe superar 60°C)
- Válvula de seguridad (debe gotear al subir temperatura)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin pérdidas, agua caliente a temperatura normal |
| ⚠️ Atención | Ánodo a reemplazar (cada 2-3 años) |
| 🔴 Profesional | Pérdida en tanque, válvula de seguridad trabada |

## Procedimiento
1. Verificar exterior: buscar goteos o corrosión
2. Verificar válvula de seguridad (levantar palanca: debe gotear)
3. Consultar fecha de instalación (vida útil ~10 años)

## Nota
El ánodo de sacrificio requiere plomero para extracción y verificación.`,
      },
      {
        name: 'Mantenimiento de cámara séptica',
        taskType: 'CLEANING',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Vaciado y limpieza de cámara séptica por servicio atmosférico. Verificar estado de paredes y tapa. Aplicable a viviendas sin red cloacal.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 120,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Nivel de lodos (no debe superar 1/3 del volumen)
- Olores fuertes en superficie (indica saturación)
- Tapas de inspección accesibles
- Filtración al terreno circundante

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Nivel normal, sin olores, tapas accesibles |
| ⚠️ Atención | Olores leves, nivel de lodos alto |
| 🔴 Profesional | Saturación, retorno de líquidos, contaminación |

## Importante
**Requiere empresa autorizada** para vaciado y limpieza (camión atmosférico).

## Procedimiento
1. Localizar tapas de inspección
2. Abrir con precaución (gases tóxicos, NO fumar cerca)
3. Verificar nivel de lodos visualmente
4. Frecuencia de vaciado: cada 1-2 años según uso`,
      },
      {
        name: 'Inspección de llave de paso general de agua',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar que la llave de paso general de agua funcione correctamente (apertura y cierre total). Lubricar si es de bronce. Fundamental para cortar el agua en emergencias.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 10,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Que la llave cierre completamente (corte total del agua)
- Estado de la llave (corrosión, dureza al girar)
- Accesibilidad (no debe estar tapada o inaccesible)
- Pérdida en la llave o sus conexiones

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cierra completamente, gira suave, accesible |
| ⚠️ Atención | Giro duro pero funcional |
| 🔴 Profesional | No cierra, pérdida activa, inaccesible |

## Procedimiento
1. Localizar la llave de paso general
2. Cerrar completamente girando en sentido horario
3. Verificar que no salga agua de ninguna canilla
4. Abrir nuevamente y verificar que fluya normalmente`,
      },
      {
        name: 'Control de bomba presurizadora',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar funcionamiento automático, presión de trabajo, ruidos anormales, pérdidas en conexiones. Limpiar filtro de succión. Revisar membrana del tanque hidroneumático.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Funcionamiento: se activa al abrir canilla, se apaga al cerrar
- Ruidos anormales (vibraciones, golpeteo)
- Pérdidas en conexiones
- Presión adecuada (verificar en baño más lejano)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Arranca y para correctamente, sin ruidos |
| ⚠️ Atención | Cicla frecuentemente (presostato a ajustar) |
| 🔴 Profesional | No arranca, ruido fuerte, pérdida |

## Procedimiento
1. Abrir una canilla y verificar que la bomba arranque
2. Cerrar canilla: bomba debe parar en segundos
3. Verificar presión en punto más lejano
4. Buscar pérdidas en conexiones de succión y descarga`,
      },
      {
        name: 'Inspección de cañerías visibles',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar cañerías expuestas (calefón, bajo mesada, lavadero): buscar corrosión en caño galvanizado, fisuras en termofusión, manchas de humedad en juntas.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Estado de cañerías expuestas (óxido, corrosión verde, goteo)
- Soportes y grampas (firmes, sin vibración)
- Aislación térmica en caños de agua caliente
- Condensación excesiva en caños de agua fría (indica mal aislación)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin corrosión, soportes firmes, sin goteos |
| ⚠️ Atención | Corrosión superficial, falta aislación |
| 🔴 Profesional | Goteo activo, corrosión avanzada, soporte cedido |

## Procedimiento
1. Recorrer cañerías visibles en subsuelo, cocina, baño
2. Buscar goteos en uniones y conexiones
3. Verificar soportes cada 1-2 metros
4. En caños de cobre: buscar color verde (corrosión)`,
      },
      {
        name: 'Limpieza de pozo de bombeo',
        taskType: 'CLEANING',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Vaciado y limpieza por servicio atmosférico. Verificar funcionamiento de bomba sumergible si tiene. Común en viviendas sin red cloacal completa.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 120,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Nivel de agua en el pozo (normal vs excesivo)
- Sedimentos acumulados en el fondo
- Estado de la bomba sumergible
- Flotante de nivel funcionando

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Nivel normal, bomba funcional, sin sedimento excesivo |
| ⚠️ Atención | Sedimento acumulado, requiere limpieza |
| 🔴 Profesional | Bomba no funciona, nivel excesivo, olor |

## Procedimiento
1. Verificar nivel de agua en el pozo
2. Activar bomba y verificar funcionamiento
3. Si hay sedimento excesivo: programar limpieza
4. Verificar flotante: debe activar/desactivar la bomba

## Nota
La limpieza del pozo requiere personal con equipo adecuado.`,
      },
      {
        name: 'Verificación de válvula de retención',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Controlar que la válvula de retención (check) evite el retorno de agua en la bomba o tanque de reserva. Si no retiene, la bomba cicla continuamente.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 15,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Funcionamiento: impide retorno de agua (sentido único)
- Que no haya golpe de ariete al cerrar canillas
- Estado exterior (corrosión, pérdidas)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin retorno de agua, sin golpes en cañería |
| ⚠️ Atención | Golpe de ariete leve |
| 🔴 Profesional | Retorno de agua, golpe fuerte, válvula trabada |

## Procedimiento
1. Verificar ubicación de la válvula (generalmente en bajada de tanque)
2. Abrir y cerrar canillas: escuchar golpes en cañería
3. Si hay retorno: la válvula necesita reemplazo`,
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
          'Verificar estado de cada artefacto de gas: cocina, horno, calefón, estufa, caldera. Buscar: olor a gas (fugas), llama amarilla o anaranjada (mala combustión), hollín alrededor de quemadores, manchas negras en paredes/techos cerca de artefactos (monóxido). Verificar: flexibles (fecha de vencimiento estampada, máximo 2 años), llaves de paso individuales por artefacto, ventilaciones reglamentarias (rejilla baja de entrada de aire + rejilla alta de salida). ATENCIÓN si: llama amarilla o flexible próximo a vencer. PROFESIONAL URGENTE si: olor a gas, hollín, o ventilación obstruida.',
        priority: 'URGENT',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Color de llama: azul = correcto, amarilla/naranja = mala combustión
- Hollín alrededor de quemadores o en paredes/techo
- Olor a gas (fugas en conexiones)
- Estado de flexibles: fecha de vencimiento estampada (máx 2 años)
- Ventilaciones: rejilla baja (entrada aire) + rejilla alta (salida)
- Llaves de paso individuales por artefacto

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Llama azul, flexibles vigentes, ventilaciones libres |
| ⚠️ Atención | Flexible próximo a vencer, ventilación parcial |
| 🔴 Profesional URGENTE | Olor a gas, llama amarilla, hollín, sin ventilación |

## Procedimiento
1. Encender cada artefacto y observar color de llama
2. Verificar flexible: buscar fecha estampada en la manguera
3. Verificar rejillas: pasar la mano y sentir circulación de aire
4. Verificar llave de paso: girar para confirmar que corta el gas
5. Oler alrededor de conexiones (gas natural es odorizado)

## PELIGRO
- NO usar fósforos para buscar fugas
- Si detecta olor a gas: NO tocar interruptores, ventilar y evacuar
- Requiere gasista matriculado ENARGAS para cualquier reparación`,
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
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Color de llama piloto: debe ser azul estable
- Color de quemadores: azul = correcto, amarillo = peligro
- Hollín alrededor de quemadores
- Estabilidad de la llama (no debe oscilar)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Llama azul estable, sin hollín |
| ⚠️ Atención | Llama con puntas amarillas leves |
| 🔴 Profesional URGENTE | Llama amarilla/naranja, hollín, olor |

## Procedimiento
1. Encender cada artefacto y observar llama
2. Llama azul = combustión completa (seguro)
3. Llama amarilla = combustión incompleta (CO, peligroso)
4. Si la llama es amarilla: apagar, ventilar, llamar gasista

## Normativa
- NAG-200 — artefactos de gas domiciliarios
- Llama amarilla produce monóxido de carbono (mortal)`,
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
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Detector de CO instalado (recomendado en todo ambiente con gas)
- Manchas negras/hollín en paredes/techo cerca de artefactos
- Llama amarilla en cualquier artefacto de gas
- Ventilación adecuada en ambientes con artefactos de gas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin signos de CO, ventilación adecuada, detector funcional |
| ⚠️ Atención | Sin detector de CO (recomendado instalar) |
| 🔴 Profesional URGENTE | Hollín, llama amarilla, síntomas en ocupantes |

## PELIGRO
El monóxido de carbono es **inodoro e invisible**. Causa muerte.
Si hay sospecha: ventilar inmediatamente y evacuar.

## Normativa
- NAG-200 — ventilación obligatoria para artefactos de gas`,
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
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Rejillas de ventilación limpias y sin obstrucciones
- Tiraje correcto en conductos (verificar con llama de fósforo)
- Nidos de pájaros o insectos en conductos
- Rejilla baja (entrada aire) + rejilla alta (salida aire)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Rejillas limpias, tiraje correcto |
| ⚠️ Atención | Rejilla parcialmente obstruida |
| 🔴 Profesional URGENTE | Conducto obstruido, sin tiraje, ventilación anulada |

## Procedimiento
1. Verificar que existan ambas rejillas (baja + alta) por ambiente
2. Acercar llama de fósforo a rejilla alta: debe inclinarse hacia adentro
3. Si no se inclina = conducto obstruido
4. Limpiar rejillas con cepillo

## Normativa
- NAG-200 — ventilación obligatoria en ambientes con gas
- Conducto obstruido = riesgo de acumulación de CO`,
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
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Limpieza de quemadores y serpentina
- Estado de intercambiador de calor
- Verificación de presión de gas
- Verificación de tiraje del conducto de evacuación

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Service al día, funcionamiento normal |
| ⚠️ Atención | Service vencido (más de 1 año) |
| 🔴 Profesional | Mal funcionamiento, llama irregular, ruidos |

## Importante
**SIEMPRE requiere gasista matriculado.** No intentar desarmar artefactos de gas.

## Normativa
- NAG-200 — mantenimiento de artefactos de gas
- Service anual recomendado por fabricantes`,
      },
      {
        name: 'Revisión periódica obligatoria NAG-226',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Inspección obligatoria de toda la instalación de gas según norma NAG-226. Incluye prueba de hermeticidad de cañerías, verificación de llaves, reguladores y conexiones. Debe ser realizada por gasista matriculado con matrícula habilitada por ENARGAS. Frecuencia: cada 3 años para vivienda unifamiliar. La oblea amarilla debe estar vigente y visible. Verificar: prueba de hermeticidad con manómetro (no con jabón), estado de regulador de presión, ventilaciones en todos los ambientes con artefactos. SIEMPRE requiere profesional matriculado — no intentar verificar hermeticidad sin instrumental.',
        priority: 'URGENT',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 36,
        estimatedDurationMinutes: 90,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Oblea vigente (pegada en medidor o artefacto principal)
- Prueba de hermeticidad de toda la instalación
- Estado de regulador de presión
- Ventilaciones reglamentarias en todos los ambientes

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Oblea vigente, instalación aprobada |
| ⚠️ Atención | Oblea próxima a vencer |
| 🔴 Profesional | Oblea vencida o ausente, falta de revisión |

## Importante
**OBLIGATORIA cada 3 años** para vivienda unifamiliar.
**SOLO gasista matriculado ENARGAS** puede realizar esta revisión.

## Normativa
- NAG-226 (ENARGAS) — procedimiento de revisión periódica
- Resolución ENARGAS 696/2024`,
      },
      {
        name: 'Verificación de llave de paso general de gas',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar que la llave de paso general (antes del medidor) funcione correctamente. Debe girar sin dificultad. Identificar su ubicación y asegurar acceso libre.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 5,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Que la llave cierre completamente (corte total del gas)
- Accesibilidad: debe poder cerrarse rápidamente en emergencia
- Estado: sin corrosión ni dureza excesiva al girar
- Identificación clara (todos deben saber dónde está)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cierra bien, accesible, todos la conocen |
| ⚠️ Atención | Giro duro, ubicación difícil |
| 🔴 Profesional | No cierra, pérdida en la llave |

## Procedimiento
1. Localizar la llave de paso general
2. Cerrar (girar 90° perpendicular al caño = cerrado)
3. Verificar que ningún artefacto encienda
4. Abrir nuevamente (paralelo al caño = abierto)

## Normativa
- NAG-200 — llaves de paso obligatorias`,
      },
      {
        name: 'Control del medidor de gas',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Inspeccionar estado del medidor: corrosión, golpes, pérdidas audibles (silbido). Verificar que el registro sea accesible para lectura de la distribuidora.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 10,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Estado del gabinete (sin herrumbre, ventilado)
- Lectura del medidor (para comparar consumo)
- Conexiones sin pérdidas (olor a gas)
- Regulador de presión en buen estado

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin olor, gabinete en buen estado, lectura normal |
| ⚠️ Atención | Gabinete deteriorado |
| 🔴 Profesional | Olor a gas en medidor, pérdida |

## Procedimiento
1. Verificar gabinete externo
2. Anotar lectura del medidor (para control de consumo)
3. Oler alrededor de conexiones (gas natural es odorizado)
4. NO manipular regulador ni conexiones

## Normativa
- NAG-200 — medidores e instalaciones de gas`,
      },
      {
        name: 'Inspección de chimenea y conducto de humos',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar que el conducto de humos (de calefón, caldera o estufa tiro balanceado) esté libre de obstrucciones, sellado en sus uniones, y con sombrerete en buen estado. Riesgo de CO.',
        priority: 'URGENT',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Obstrucciones en el conducto (nidos, hollín acumulado)
- Tiraje correcto (verificar con llama)
- Estado del sombrero o remate de chimenea
- Fisuras en el conducto (especialmente en tramos interiores)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Tiraje correcto, sin obstrucciones, sombrero en buen estado |
| ⚠️ Atención | Hollín acumulado, requiere limpieza |
| 🔴 Profesional | Sin tiraje, conducto fisurado, sombrero faltante |

## Procedimiento
1. Verificar sombrero de chimenea desde exterior (visual)
2. Acercar llama a boca del conducto: debe ser aspirada
3. Si no hay tiraje: posible obstrucción
4. Limpieza de hollín con deshollinador (profesional)

## Normativa
- NAG-200 — evacuación de productos de combustión
- Conducto obstruido = acumulación de CO en ambiente`,
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
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Bisagras que chirrían o resisten al movimiento
- Cerraduras duras al girar la llave
- Oxidación en componentes metálicos
- Holgura excesiva en bisagras (puerta cae)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Movimiento suave, sin ruidos, sin óxido |
| ⚠️ Atención | Chirrido, dureza leve al girar cerradura |
| 🔴 Profesional | Cerradura trabada, bisagra rota, puerta descolgada |

## Procedimiento
1. Abrir y cerrar cada puerta lentamente
2. Aplicar lubricante (WD-40 o grafito) en bisagras que chirrían
3. Aplicar grafito en polvo en cerraduras duras (NO aceite)
4. Verificar tornillos de bisagras (ajustar si están flojos)`,
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
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Burletes deteriorados (aplastados, rotos, faltantes)
- Corrientes de aire con ventana/puerta cerrada
- Sellado de silicona en perímetro exterior
- Condensación excesiva en vidrios (indica falta de hermeticidad)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Burletes íntegros, sin corrientes de aire |
| ⚠️ Atención | Burletes aplastados, sellado deteriorado |
| 🔴 Profesional | Burletes faltantes en múltiples aberturas, filtración de agua |

## Procedimiento
1. Cerrar ventana/puerta y pasar la mano por el perímetro
2. Si se siente corriente de aire = burlete a reemplazar
3. Verificar sellado exterior con silicona
4. En DVH: buscar condensación entre vidrios (sello roto)`,
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
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Estado de marcos de madera: hinchazón por humedad, podredumbre
- Marcos de aluminio: corrosión, oxidación blanca
- Marcos de hierro: óxido, descascaramiento de pintura
- Fijación al muro: que no se mueva al empujar

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Marcos firmes, sin deterioro, pintura íntegra |
| ⚠️ Atención | Pintura descascarada, oxidación superficial |
| 🔴 Profesional | Podredumbre en madera, marco suelto, óxido perforante |

## Procedimiento
1. Inspeccionar cada marco visualmente
2. Empujar suavemente: no debe moverse
3. En madera: buscar zonas blandas (pinchar con destornillador)
4. En hierro: buscar ampollas de óxido bajo la pintura`,
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
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Rajaduras o fisuras en vidrios
- Estado de masilla o silicona de fijación
- Vidrios flojos (vibran con el viento)
- Vidrios de seguridad donde corresponda (puertas, mamparas)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Vidrios íntegros, masilla/silicona en buen estado |
| ⚠️ Atención | Masilla deteriorada, vidrio levemente flojo |
| 🔴 Profesional | Vidrio rajado, riesgo de caída de fragmentos |

## Procedimiento
1. Verificar cada vidrio visualmente
2. Presionar suavemente bordes: no debe haber juego
3. Verificar masilla: que no esté reseca ni faltante
4. En vidrios de seguridad: verificar sello de conformidad`,
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
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Pintura o barniz descascarado
- Hinchazón por absorción de humedad
- Signos de ataque de insectos (polvo fino = termitas/carcoma)
- Podredumbre (madera blanda al presionar)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Protección íntegra, madera firme y seca |
| ⚠️ Atención | Barniz desgastado, requiere renovación |
| 🔴 Profesional | Podredumbre, ataque de insectos |

## Procedimiento
1. Verificar estado de pintura/barniz en todas las caras
2. Presionar con destornillador en zonas sospechosas
3. Buscar polvo fino al pie del marco (insectos xilófagos)
4. Si la madera está sana: lijar y aplicar protector/barniz`,
      },
      {
        name: 'Mantenimiento de persianas de enrollar',
        taskType: 'ADJUSTMENT',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar funcionamiento de la cinta o cadena, estado de tablillas, lubricación del eje. Limpiar guías laterales. Muy común en viviendas argentinas.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Funcionamiento: sube y baja sin trabarse
- Estado de cintas o correas (desgaste, deshilachado)
- Cajón de persiana: no debe tener juego ni infiltraciones
- Tablillas: sin roturas ni deformación

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Funciona suavemente, cintas en buen estado |
| ⚠️ Atención | Cinta desgastada, funcionamiento con esfuerzo |
| 🔴 Profesional | Trabada, cinta rota, tablillas rotas |

## Procedimiento
1. Subir y bajar cada persiana completamente
2. Verificar estado de cinta/correa
3. Verificar sellado del cajón (evitar infiltración de aire)
4. Limpiar guías laterales con trapo húmedo`,
      },
      {
        name: 'Control de mosquiteros',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de la tela mosquitera (roturas, despegues del marco). Fundamental en zona Litoral por presencia de mosquitos (dengue).',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Estado de la tela (agujeros, desprendimiento del marco)
- Mecanismo de deslizamiento o fijación
- Oxidación del marco (en mosquiteros de aluminio)
- Tela tensada correctamente (sin bolsas)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Tela íntegra, mecanismo funcional |
| ⚠️ Atención | Pequeños agujeros, tela floja |
| 🔴 Profesional | Tela rota/ausente, marco deformado |

## Procedimiento
1. Verificar tela en busca de agujeros o desprendimientos
2. Verificar deslizamiento en guías
3. Parches de emergencia con tela y adhesivo para agujeros pequeños`,
      },
      {
        name: 'Inspección de rejas y protecciones metálicas',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar soldaduras, fijación a muros, estado de pintura o galvanizado. Buscar corrosión, especialmente en bases empotradas. Incluye portones y barandas metálicas.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 25,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Óxido y corrosión (especialmente en base y soldaduras)
- Fijación al muro (que no se mueva al empujar)
- Pintura antióxido en buen estado
- Seguridad: que cumpla función de protección (sin puntos débiles)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin óxido, fijación firme, pintura íntegra |
| ⚠️ Atención | Óxido superficial, pintura descascarada |
| 🔴 Profesional | Óxido perforante, soldaduras rotas, reja suelta |

## Procedimiento
1. Verificar fijación: empujar y tirar con fuerza moderada
2. Buscar óxido en base (zona de contacto con muro/piso)
3. Verificar soldaduras: buscar fisuras o desprendimiento
4. Si hay óxido: limpiar con cepillo de alambre y pintar antióxido`,
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
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Descascaramiento, ampollas, decoloración
- Manchas de humedad que atraviesan la pintura
- Eflorescencias (depósitos blancos de sales)
- Moho o verdín (especialmente en zonas con sombra)
- Chalking (la pintura se vuelve polvorienta al tocar)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Pintura firme, color uniforme, sin descascaramiento |
| ⚠️ Atención | Descascaramiento localizado, decoloración leve |
| 🔴 Profesional | Descascaramiento extenso, humedad que atraviesa muro |

## Procedimiento
1. Recorrer todas las fachadas y muros exteriores
2. Verificar zonas bajas (salpicaduras de agua)
3. Verificar zonas con sombra permanente (moho)
4. Pasar la mano: si queda polvo blanco = chalking (repintar)
5. Fotografiar áreas afectadas

## Normativa
- Código de Edificación CABA — mantenimiento de fachadas
- Vida útil pintura exterior: 5 años (según exposición)`,
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
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Manchas oscuras en paredes y techos
- Pintura ampollada o descascarada
- Olor a humedad persistente
- Moho visible (especialmente en esquinas y detrás de muebles)
- Condensación en ventanas

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin manchas, sin olor, sin condensación excesiva |
| ⚠️ Atención | Manchas pequeñas, condensación en ventanas |
| 🔴 Profesional | Moho extenso, humedad que no seca, olor persistente |

## Procedimiento
1. Inspeccionar esquinas superiores de cada ambiente
2. Mover muebles alejados de la pared y buscar detrás
3. Verificar baños y cocina: zonas más propensas
4. Buscar puente térmico en columnas y vigas (condensación)

## Normativa
- Código de Edificación CABA — condiciones de habitabilidad`,
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
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Efectividad del tratamiento existente (si fue aplicado)
- Zonas donde la humedad reaparece después del tratamiento
- Estado de la capa aisladora horizontal
- Necesidad de tratamiento nuevo

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin recurrencia de humedad, tratamiento vigente |
| ⚠️ Atención | Humedad leve recurrente en zonas tratadas |
| 🔴 Profesional | Tratamiento fallido, humedad generalizada |

## Nota
Se recomienda profesional especializado en patologías de humedad para diagnóstico y tratamiento.`,
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
        defaultSector: 'BATHROOM',
        inspectionGuide: `## Qué buscar
- Baldosas flojas o desprendidas (golpear: sonido hueco)
- Juntas deterioradas, faltantes o con moho
- Fisuras en cerámicos
- Manchas de humedad detrás de revestimientos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cerámicos firmes, juntas completas, sin fisuras |
| ⚠️ Atención | Juntas deterioradas, 1-2 baldosas flojas |
| 🔴 Profesional | Múltiples baldosas desprendidas, humedad detrás |

## Procedimiento
1. Golpear suavemente cada cerámico con nudillos
2. Sonido hueco = cerámico despegado del sustrato
3. Verificar juntas: buscar faltantes o con moho negro
4. En baño/cocina: verificar sellado de silicona en perímetro`,
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
        defaultSector: 'BATHROOM',
        inspectionGuide: `## Qué buscar
- Estado de silicona en unión pared-mesada, pared-bañera, pared-ducha
- Moho negro en juntas de silicona
- Silicona despegada o agrietada
- Filtración de agua detrás de revestimientos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Silicona íntegra, sin moho, adherida |
| ⚠️ Atención | Moho superficial, silicona con grietas menores |
| 🔴 Profesional | Silicona despegada, filtración activa |

## Procedimiento
1. Verificar todas las juntas de silicona en baño y cocina
2. Tirar suavemente del borde: no debe despegarse
3. Si hay moho: limpiar con lavandina diluida
4. Si está agrietada: retirar y rehacer con silicona sanitaria`,
      },
      {
        name: 'Repintado de fachada exterior',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Repintado completo de muros exteriores con pintura para exteriores. Incluye reparación de revoques dañados, enduido y dos manos de pintura. Protege el revoque. Frecuencia: cada 5 años según exposición y tipo de pintura.',
        priority: 'MEDIUM',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 60,
        estimatedDurationMinutes: 480,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Necesidad de repintado (pintura desgastada, descascarada)
- Reparación previa de revoques dañados
- Estado de la superficie base (preparación necesaria)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Pintura en buen estado, sin necesidad de repintado |
| ⚠️ Atención | Desgaste visible, programar repintado |
| 🔴 Profesional | Descascaramiento extenso + daño en revoque |

## Nota
Se recomienda profesional para trabajos en altura. Frecuencia: cada 5 años según exposición y tipo de pintura.

## Normativa
- Código de Edificación CABA — mantenimiento de fachadas`,
      },
      {
        name: 'Tratamiento de capa aisladora horizontal',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Si hay humedad ascendente crónica: evaluar estado de la capa aisladora horizontal. Puede requerir inyección de silicona hidrófuga en base de muros.',
        priority: 'HIGH',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 240,
        defaultSector: 'BASEMENT',
        inspectionGuide: `## Qué buscar
- Presencia de capa aisladora (barrera contra humedad ascendente)
- Efectividad: no debe haber humedad por encima de la capa
- Fisuras o discontinuidades en la capa

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin humedad ascendente, capa aisladora funcional |
| ⚠️ Atención | Humedad leve en base de muros |
| 🔴 Profesional | Humedad generalizada, capa aisladora ausente o dañada |

## Importante
**Requiere profesional** para diagnóstico y reparación de capa aisladora.`,
      },
      {
        name: 'Inspección de revoques interiores',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar adherencia de revoques interiores golpeando con nudillos (sonido hueco indica desprendimiento). Buscar fisuras, ampollas. Los revoques a la cal son más susceptibles.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 25,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Fisuras en revoques (mapa de fisuras)
- Zonas huecas (golpear con nudillos)
- Humedad, eflorescencias, descascaramiento
- Desprendimiento de material

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Revoque firme, sin fisuras ni zonas huecas |
| ⚠️ Atención | Fisuras capilares, descascaramiento leve |
| 🔴 Profesional | Zonas huecas extensas, desprendimiento activo |

## Procedimiento
1. Golpear superficies con nudillos (sonido hueco = desprendido)
2. Verificar esquinas y uniones muro-techo
3. Buscar manchas de humedad en zonas bajas`,
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
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Baldosas flojas, rotas o faltantes
- Desniveles que generen riesgo de tropiezos
- Grietas en contrapiso
- Pendiente hacia la vivienda (debe ser al revés)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Superficie nivelada, sin baldosas flojas, pendiente correcta |
| ⚠️ Atención | 1-2 baldosas flojas, grieta menor |
| 🔴 Profesional | Desnivel peligroso, pendiente hacia la casa, hundimiento |

## Procedimiento
1. Recorrer todos los senderos verificando estabilidad
2. Verificar pendiente: el agua debe escurrir HACIA AFUERA de la casa
3. Buscar raíces de árboles que levanten baldosas`,
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
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Fisuras o inclinación en medianeras
- Estado de cercos perimetrales (madera, alambre, hierro)
- Humedad o eflorescencias en muros medianeros
- Vegetación invasiva desde terrenos linderos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Muro aplomado, cerco firme, sin fisuras |
| ⚠️ Atención | Fisuras leves, cerco con postes flojos |
| 🔴 Profesional | Muro inclinado, riesgo de derrumbe |

## Normativa
- Código Civil argentino — medianeras y límites de propiedad
- Municipalidad local — distancias de árboles a medianeras`,
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
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Rejillas de piso obstruidas (hojas, tierra)
- Bocas de tormenta tapadas
- Agua estancada en patios o jardín
- Pendiente correcta hacia los desagües

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Desagües libres, sin agua estancada |
| ⚠️ Atención | Rejillas sucias, limpieza necesaria |
| 🔴 Profesional | Desagüe obstruido internamente, agua ingresa a la casa |

## Procedimiento
1. Limpiar rejillas de piso exteriores
2. Verter agua y verificar velocidad de desagote
3. Si el agua no baja: posible obstrucción en cañería`,
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
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Estado del agua (claridad, pH, cloro)
- Revestimiento (fisuras, desprendimiento de venecitas)
- Equipos: bomba, filtro, clorinador
- Borde perimetral y deck (seguridad antideslizante)
- Cerco de seguridad (obligatorio si hay niños)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Agua clara, equipos funcionando, revestimiento íntegro |
| ⚠️ Atención | Agua turbia, filtro sucio, fisura leve en borde |
| 🔴 Profesional | Pérdida de agua (nivel baja), venecitas desprendidas, bomba rota |

## Normativa
- Ordenanza municipal — cerco de seguridad obligatorio
- Decreto 3181/2007 (PBA) — piletas de natación`,
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
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Ramas en contacto con techos, cables o canaletas
- Raíces que levantan veredas o afectan cimientos
- Árboles inclinados hacia la vivienda
- Ramas secas que puedan caer

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Árboles sin contacto con estructura, raíces contenidas |
| ⚠️ Atención | Ramas próximas a cables o techos |
| 🔴 Profesional | Árbol inclinado, raíces dañando cimientos |

## Importante
La poda de árboles en vereda requiere autorización municipal. NO podar sin consultar.

## Normativa
- Ley 12276 (PBA) — arbolado público
- Código Civil — distancias de árboles a medianeras`,
      },
      {
        name: 'Mantenimiento de parrilla y quincho',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar estado del hogar: fisuras en ladrillos refractarios, estado de la rejilla y asador, limpieza del conducto de humos, revoque de chimenea.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Estado del hogar (fisuras en ladrillos refractarios)
- Conducto de humos (tiraje correcto)
- Mesada y superficies de trabajo
- Estructura del quincho (columnas, techo)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Hogar íntegro, buen tiraje, estructura firme |
| ⚠️ Atención | Ladrillos fisurados, tiraje lento |
| 🔴 Profesional | Conducto obstruido, estructura comprometida |

## Procedimiento
1. Encender fuego pequeño y verificar tiraje
2. Inspeccionar ladrillos refractarios (fisuras profundas = reemplazar)
3. Verificar estructura del quincho (columnas, vigas, techo)`,
      },
      {
        name: 'Control de cochera y garaje',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de losa o techo, piso (fisuras, manchas de aceite), portón (mecanismo, rieles, motor si es automático), iluminación, instalación eléctrica.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Estado del portón (mecanismo, guías, motor si es automático)
- Piso (fisuras, manchas de aceite, nivelación)
- Instalación eléctrica (iluminación, tomacorrientes)
- Desagüe de piso

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Portón funcional, piso en buen estado, iluminación correcta |
| ⚠️ Atención | Portón con esfuerzo, piso fisurado |
| 🔴 Profesional | Portón trabado, motor quemado, instalación eléctrica deteriorada |

## Procedimiento
1. Abrir y cerrar portón: verificar movimiento suave
2. Lubricar guías y bisagras
3. Verificar sensor de seguridad (portón automático)`,
      },
      {
        name: 'Inspección de pérgola, semi-cubierta o deck',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de la madera o metal: buscar pudrición, termitas, oxidación. Aplicar protector o lasur a madera. Controlar fijaciones y tornillería.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Estado de la madera (podredumbre, insectos, astillado)
- Fijaciones y anclajes (tornillos, bulones)
- Protección (barniz, aceite, pintura)
- Estabilidad de la estructura

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Madera firme, protección vigente, fijaciones sólidas |
| ⚠️ Atención | Protección desgastada, requiere mantenimiento |
| 🔴 Profesional | Podredumbre, estructura inestable, insectos |

## Procedimiento
1. Verificar estabilidad empujando lateralmente
2. Buscar zonas blandas en madera (presionar con destornillador)
3. Buscar polvo fino al pie (indicio de insectos xilófagos)
4. Verificar fecha de último tratamiento protector`,
      },
      {
        name: 'Mantenimiento de sistema de riego',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar aspersores, goteros, electroválvulas, timer/programador. Purgar sistema antes del invierno para evitar daños por heladas.',
        priority: 'LOW',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Aspersores obstruidos o rotos
- Fugas en conexiones y tuberías
- Programador/timer funcionando correctamente
- Distribución uniforme del agua

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos los aspersores funcionan, sin fugas |
| ⚠️ Atención | 1-2 aspersores obstruidos, programador descalibrado |
| 🔴 Profesional | Tubería rota enterrada, múltiples fugas |

## Procedimiento
1. Activar cada zona del riego manualmente
2. Verificar que todos los aspersores funcionen
3. Buscar zonas húmedas inesperadas (tubería rota)`,
      },
      {
        name: 'Inspección de cerco perimetral y portones',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de alambrados, tejidos, cercos vivos, postes. Portones: herrajes, soldaduras, motor automático, fotoceldas de seguridad.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 25,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Estado de postes (inclinación, podredumbre en madera)
- Alambrado o tejido: tensión correcta, sin roturas
- Portones: bisagras, cerradura, cierre automático
- Oxidación en componentes metálicos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Cerco firme, portones funcionales, sin óxido |
| ⚠️ Atención | Óxido superficial, tensión floja en alambrado |
| 🔴 Profesional | Postes inclinados, cerco caído, portón descolgado |

## Procedimiento
1. Recorrer todo el perímetro
2. Verificar tensión del alambrado
3. Abrir/cerrar cada portón
4. Buscar óxido en base de postes metálicos`,
      },
      {
        name: 'Control de tanque cisterna enterrado',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar hermeticidad, estado de bomba, flotante, tapa. Limpiar y desinfectar. Común en zonas con baja presión de red de agua.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Tapa de inspección accesible y sellada
- Nivel de agua correcto
- Estado interior (fisuras, contaminación)
- Bomba de elevación funcionando

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Tapa sellada, nivel correcto, bomba funcional |
| ⚠️ Atención | Tapa deteriorada, nivel bajo |
| 🔴 Profesional | Fisura en cisterna, contaminación, bomba dañada |

## Procedimiento
1. Verificar accesibilidad de la tapa
2. Abrir y verificar nivel y aspecto del agua
3. Activar bomba de elevación
4. Limpieza anual recomendada

## Normativa
- ENRESS — mantenimiento de tanques (aplica también a cisternas)`,
      },
      {
        name: 'Inspección de muro de contención',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Si la propiedad tiene desniveles: verificar estado del muro de contención, barbacanas de drenaje, fisuras, inclinación. Detectar movimientos.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Fisuras o desplazamiento del muro
- Inclinación (pandeo hacia afuera)
- Drenaje detrás del muro (barbacanas funcionando)
- Erosión del suelo en la base

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Muro aplomado, drenaje funcional, sin fisuras |
| ⚠️ Atención | Fisuras menores, barbacanas parcialmente obstruidas |
| 🔴 Profesional | Muro inclinado, fisuras activas, erosión en base |

## Importante
**Requiere ingeniero estructural** si hay signos de movimiento.`,
      },
      {
        name: 'Puesta en marcha y cierre estacional de pileta',
        taskType: 'ADJUSTMENT',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Apertura: destapar, limpiar, poner en marcha filtro, tratar agua. Cierre: bajar pH, agregar alguicida, tapar. Específico del clima estacional argentino.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 60,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar en apertura (primavera)
- Estado de revestimiento después del invierno
- Limpieza de filtro y bomba
- Nivel de agua y reposición
- Verificación de químicos (pH, cloro)

## Qué buscar en cierre (otoño)
- Limpieza profunda antes de cubrir
- Nivel de agua para invernada
- Protección de equipos (cubrir bomba si está expuesta)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Equipos funcionan, revestimiento íntegro |
| ⚠️ Atención | Filtro desgastado, bomba con ruido |
| 🔴 Profesional | Pérdida de agua, bomba no funciona, fisura en vaso |`,
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
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Filtros sucios u obstruidos (reducen eficiencia)
- Polvo acumulado en la unidad interior
- Olor desagradable al encender (hongos en filtro)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Filtros limpios, sin olor |
| ⚠️ Atención | Filtros con polvo visible, requieren lavado |
| 🔴 Profesional | Olor fuerte a moho, filtro dañado |

## Procedimiento
1. Apagar el equipo
2. Abrir tapa frontal de unidad interior
3. Retirar filtros deslizándolos
4. Lavar con agua y jabón neutro
5. Dejar secar completamente antes de reinstalar
6. Frecuencia: cada 2-3 meses en uso intensivo`,
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
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Eficiencia de enfriamiento/calefacción
- Ruidos anormales en unidad interior o exterior
- Goteo de agua donde no corresponde
- Gas refrigerante (si enfría poco = posible fuga)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Enfría/calienta correctamente, sin ruidos |
| ⚠️ Atención | Service vencido (>1 año), eficiencia reducida |
| 🔴 Profesional | No enfría, gotea, ruido fuerte, olor a quemado |

## Importante
**Requiere técnico matriculado** para manipulación de gas refrigerante.

## Normativa
- Service anual recomendado por fabricantes
- Manipulación de gas refrigerante requiere habilitación`,
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
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Serpentina limpia (sin pelusas ni suciedad acumulada)
- Ventilador funcionando sin vibraciones
- Soportes y anclajes firmes
- Desagüe de condensado (no debe gotear sobre vía pública)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Serpentina limpia, ventilador suave, soportes firmes |
| ⚠️ Atención | Suciedad en serpentina, requiere limpieza |
| 🔴 Profesional | Soportes flojos en altura, ventilador con vibración |

## Procedimiento
1. Verificar visualmente estado de la serpentina
2. Encender y escuchar: no debe vibrar excesivamente
3. Verificar que el desagüe de condensado drene correctamente
4. NO lavar con hidrolavadora (puede dañar aletas)`,
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
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Rejillas de ventilación sin obstrucciones
- Circulación de aire entre ambientes
- Condensación excesiva en ventanas (indica poca ventilación)
- Ventanas que permitan apertura efectiva

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Buena circulación, sin condensación, rejillas libres |
| ⚠️ Atención | Condensación leve, rejillas parcialmente obstruidas |
| 🔴 Profesional | Ambientes sin ventilación posible, moho por condensación |

## Procedimiento
1. Verificar rejillas en cada ambiente
2. Abrir ventanas enfrentadas y sentir circulación cruzada
3. Buscar condensación en vidrios (especialmente en invierno)`,
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
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Diferencia de temperatura notable entre interior y exterior
- Paredes frías al tacto en invierno (puente térmico)
- Condensación en muros y techos
- Consumo energético excesivo de climatización

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Confort térmico aceptable, sin condensación |
| ⚠️ Atención | Puentes térmicos localizados, condensación leve |
| 🔴 Profesional | Condensación generalizada, consumo energético excesivo |

## Nota
Se recomienda profesional para diagnóstico termográfico y propuesta de mejoras.`,
      },
      {
        name: 'Inspección de calefacción por losa radiante',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar presión del circuito, purgar aire de radiadores/circuitos, controlar caldera asociada. Aplica a viviendas con piso radiante.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Funcionamiento uniforme (toda la superficie debe calentar)
- Zonas frías (posible obstrucción o fuga en circuito)
- Estado de la caldera o fuente de calor
- Presión del sistema (manómetro en rango)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Calentamiento uniforme, presión estable |
| ⚠️ Atención | Zona fría localizada, presión baja |
| 🔴 Profesional | Múltiples zonas frías, pérdida de presión, fuga |

## Importante
**Requiere profesional matriculado** para reparaciones en el circuito.`,
      },
      {
        name: 'Control de ventiladores de techo',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar fijación al cielorraso (especialmente en durlock), balanceo, ruidos, funcionamiento de velocidades y reversa.',
        priority: 'LOW',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 15,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Estabilidad al girar (no debe temblar ni hacer ruido)
- Estado de aspas (fisuras, deformación)
- Fijación al techo (soporte firme)
- Funcionamiento en todas las velocidades

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Gira suave, silencioso, firme |
| ⚠️ Atención | Vibración leve, aspa suelta |
| 🔴 Profesional | Vibración fuerte, soporte flojo, ruido mecánico |

## Procedimiento
1. Encender en cada velocidad
2. Verificar que no vibre ni haga ruido
3. Si vibra: verificar tornillos de aspas y soporte
4. Limpiar aspas con trapo húmedo (acumulan polvo)`,
      },
    ],
  },
  {
    name: 'Humedad e Impermeabilización',
    icon: '💧',
    description: 'Control de humedad, impermeabilización y aislación hidrófuga',
    displayOrder: 9,
    tasks: [
      {
        name: 'Inspección de manchas y eflorescencias',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Recorrer muros interiores y exteriores buscando manchas de humedad, eflorescencias (sales blancas) y desprendimientos de pintura que indiquen infiltración.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
        defaultSector: 'BASEMENT',
        inspectionGuide: `## Qué buscar
- Manchas de humedad en muros interiores y exteriores
- Eflorescencias blancas (sales cristalizadas)
- Moho (manchas negras o verdes)
- Patrón de la mancha: ascendente, descendente, localizada

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin manchas, sin eflorescencias, sin moho |
| ⚠️ Atención | Eflorescencias leves, manchas secas |
| 🔴 Profesional | Manchas activas, moho extenso, eflorescencias recurrentes |

## Procedimiento
1. Recorrer todos los muros con buena iluminación
2. Identificar patrón: ascendente (capilaridad), descendente (filtración), localizada (cañería)
3. Medir altura de mancha ascendente (>50cm = importante)
4. Fotografiar con referencia de ubicación

## Normativa
- INTI — protocolo de relevamiento de patologías de humedad`,
      },
      {
        name: 'Control de muros enterrados y subsuelos',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Inspeccionar muros de sótano o semi-enterrados. Verificar estado de impermeabilización exterior y presencia de filtraciones. Medir humedad con higrómetro.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
        defaultSector: 'BASEMENT',
        inspectionGuide: `## Qué buscar
- Humedad en muros en contacto con el terreno
- Eflorescencias en base de muros de subsuelo
- Filtración activa (goteo o escurrimiento)
- Estado de impermeabilización exterior (si es visible)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Muros secos, sin eflorescencias |
| ⚠️ Atención | Humedad leve en base, eflorescencias aisladas |
| 🔴 Profesional | Filtración activa, humedad generalizada |

## Importante
**Requiere profesional** para diagnóstico y solución de impermeabilización enterrada.`,
      },
      {
        name: 'Verificación de impermeabilización en baños y cocina',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de sellados en encuentros piso-pared de duchas, bañeras y mesadas. Buscar signos de filtración en techos inferiores.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'BATHROOM',
        inspectionGuide: `## Qué buscar
- Estado de la impermeabilización bajo pisos y en muros de ducha
- Manchas de humedad en techo del piso inferior (si es PA)
- Sellado de silicona en perímetro de bañera/ducha
- Rejuntes en buen estado

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin manchas en piso inferior, silicona íntegra, rejuntes completos |
| ⚠️ Atención | Rejuntes deteriorados, silicona con moho |
| 🔴 Profesional | Mancha en techo de piso inferior = filtración activa |

## Procedimiento
1. Verificar techo del ambiente debajo del baño (manchas)
2. Revisar silicona en bañera, ducha, mesada
3. Verificar rejuntes en piso y paredes`,
      },
      {
        name: 'Control de ventilación para prevención de condensación',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar correcto funcionamiento de extractores y ventilación natural en baños, cocina y lavadero. La condensación crónica genera moho y deterioro.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 20,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Condensación en ventanas y muros fríos
- Moho en esquinas (especialmente superiores)
- Ambientes con poca ventilación natural
- Extractores de baño/cocina funcionando

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin condensación, ventilación adecuada |
| ⚠️ Atención | Condensación leve en ventanas en invierno |
| 🔴 Profesional | Moho por condensación crónica, sin ventilación posible |

## Procedimiento
1. Verificar condensación en ventanas (especialmente en invierno)
2. Verificar extractores de baño y cocina (deben funcionar)
3. Recomendar ventilación diaria mínima de 15 minutos`,
      },
      {
        name: 'Inspección post-lluvia intensa',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Tras lluvias fuertes: recorrer la vivienda buscando filtraciones activas, goteras, acumulación de agua en terraza. Documentar para seguimiento. Frecuente en Litoral nov-mar.',
        priority: 'HIGH',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Filtraciones nuevas en techos y muros
- Agua acumulada en patios, jardín, subsuelo
- Desagües desbordados
- Humedad en muros que no existía antes

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin filtraciones ni acumulación de agua |
| ⚠️ Atención | Acumulación menor que drena sola |
| 🔴 Profesional | Filtración activa, agua en subsuelo, muro saturado |

## Procedimiento
1. Recorrer interior: buscar goteos o manchas nuevas
2. Verificar exterior: patios, senderos, jardín (agua estancada)
3. Verificar subsuelo si tiene (nivel de agua)
4. Verificar canaletas y bajadas (pueden haberse obstruido)`,
      },
      {
        name: 'Control de drenaje perimetral',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar que el drenaje perimetral de la vivienda funcione correctamente. Buscar empozamientos contra muros. Limpiar caños de drenaje. Crítico en zona Litoral con napa freática alta.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'GARDEN',
        inspectionGuide: `## Qué buscar
- Pendiente del terreno alrededor de la casa (debe ser hacia afuera)
- Drenaje francés o zanjeo perimetral (si existe)
- Acumulación de agua junto a cimientos
- Estado de los caños de drenaje

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Agua escurre hacia afuera, sin acumulación |
| ⚠️ Atención | Pendiente insuficiente en algunos sectores |
| 🔴 Profesional | Agua se acumula junto a cimientos, drenaje obstruido |

## Procedimiento
1. Observar durante o después de lluvia: ¿hacia dónde va el agua?
2. Verificar que no haya charcos permanentes junto a muros
3. Si hay drenaje francés: verificar que no esté colmatado`,
      },
    ],
  },
  {
    name: 'Seguridad contra Incendio',
    icon: '🧯',
    description: 'Detección de humo, matafuegos y prevención de incendios',
    displayOrder: 10,
    tasks: [
      {
        name: 'Verificación de detectores de humo',
        taskType: 'TEST',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Presionar el botón de TEST de cada detector de humo. Debe sonar la alarma. Verificar: que haya al menos 1 detector por planta/nivel, que estén en el techo o a máximo 30cm del techo, que no estén obstruidos por muebles, que las baterías no estén vencidas (la mayoría dura 1 año, los de litio 10 años). Limpiar polvo acumulado con paño seco. ATENCIÓN si: batería baja (emite pitido intermitente). PROFESIONAL no requerido — el propietario puede reemplazar baterías y detectores.',
        priority: 'HIGH',
        recurrenceType: 'MONTHLY',
        recurrenceMonths: 1,
        estimatedDurationMinutes: 10,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Presencia de detectores en cada nivel/planta
- Funcionamiento del botón de TEST (debe sonar alarma)
- Estado de baterías (pitido intermitente = batería baja)
- Ubicación correcta (techo, no obstruido por muebles)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Todos los detectores funcionan al presionar TEST |
| ⚠️ Atención | Batería baja (pitido intermitente) |
| 🔴 Profesional | No funciona, no tiene detectores |

## Procedimiento
1. Presionar botón TEST de cada detector
2. Debe sonar alarma fuerte
3. Si no suena: reemplazar batería primero
4. Si sigue sin funcionar: reemplazar detector completo
5. Limpiar polvo acumulado con paño seco

## Normativa
- Recomendación: mínimo 1 detector por planta
- Baterías: reemplazo anual (excepto litio 10 años)`,
      },
      {
        name: 'Control y recarga de matafuegos',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar presión del manómetro, estado de la manguera, precinto y fecha de vencimiento. Recargar o reemplazar si corresponde. Mínimo 1 matafuego ABC por planta.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Fecha de última recarga (etiqueta adherida, vigencia 1 año)
- Presión del manómetro (aguja en zona verde)
- Precinto de seguridad intacto
- Accesibilidad: ubicación visible y señalizada

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Recarga vigente, presión correcta, accesible |
| ⚠️ Atención | Recarga próxima a vencer (menos de 30 días) |
| 🔴 Profesional | Recarga vencida, presión baja, precinto roto |

## Importante
La recarga debe ser realizada por **empresa habilitada** (CEMERA).

## Normativa
- Ley 6116 CABA — vigencia de recarga: 1 año
- Decreto 351/79 — protección contra incendios`,
      },
      {
        name: 'Revisión de instalación eléctrica como fuente de ignición',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar que no haya cables pelados, empalmes sin aislar, tableros con signos de recalentamiento u otros riesgos eléctricos que puedan causar incendio.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Cables recalentados o con aislación derretida
- Empalmes fuera de caja (chispas)
- Tablero subdimensionado (térmicas que saltan frecuentemente)
- Zapatillas o triples sobrecargados

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin signos de calentamiento, empalmes en caja |
| ⚠️ Atención | Uso de triples/zapatillas en exceso |
| 🔴 Profesional | Cables derretidos, chispas, olor a quemado |

## Normativa
- AEA 90364 — prevención de incendios en instalaciones eléctricas
- Cortocircuito: principal causa de incendio doméstico en Argentina`,
      },
      {
        name: 'Verificación de vías de evacuación',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Asegurar que pasillos, escaleras y salidas no estén obstruidos. Verificar que las puertas de salida abran correctamente. Identificar punto de reunión familiar.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 15,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Que las salidas estén libres de obstáculos
- Que las puertas abran fácilmente (no trabadas)
- Iluminación en pasillos y escaleras
- Que todos los habitantes conozcan la salida de emergencia

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Salidas libres, puertas funcionales, iluminación correcta |
| ⚠️ Atención | Objetos reducen paso, iluminación insuficiente |
| 🔴 Profesional | Salida bloqueada, puerta trabada, sin iluminación |

## Procedimiento
1. Recorrer el camino desde cada dormitorio hasta la salida
2. Verificar que puertas abran sin esfuerzo
3. Verificar iluminación de emergencia (si existe)
4. En PH o edificio: verificar escalera de escape`,
      },
      {
        name: 'Control de detector de monóxido de carbono',
        taskType: 'TEST',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar funcionamiento del detector de CO (botón test). Cambiar baterías. Verificar fecha de vencimiento del sensor (5-7 años). Obligatorio según NAG-200 en ambientes con gas.',
        priority: 'HIGH',
        recurrenceType: 'MONTHLY',
        recurrenceMonths: 1,
        estimatedDurationMinutes: 5,
        defaultSector: 'INTERIOR',
        inspectionGuide: `## Qué buscar
- Presencia de detector de CO en ambientes con gas
- Funcionamiento del botón TEST
- Ubicación correcta (1.5m de altura, cerca de artefactos de gas)
- Estado de batería

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Detector funcional, bien ubicado |
| ⚠️ Atención | Sin detector (altamente recomendado) |
| 🔴 Profesional | Detector alarma constantemente (posible fuga de CO) |

## PELIGRO
El monóxido de carbono es **inodoro y mortal**. Si el detector alarma: ventilar y evacuar inmediatamente.

## Normativa
- Recomendado en todo ambiente con artefactos de gas
- Detección temprana salva vidas`,
      },
      {
        name: 'Revisión de instalación de gas como fuente de ignición',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar que no haya pérdidas de gas en conexiones flexibles, llaves, y que los artefactos tengan válvula de seguridad (corte por ausencia de llama).',
        priority: 'URGENT',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INSTALLATIONS',
        inspectionGuide: `## Qué buscar
- Flexibles vencidos (fecha estampada, máx 2 años)
- Fugas en conexiones (olor a gas)
- Artefactos con llama amarilla
- Ventilación obstruida

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Flexibles vigentes, sin olor, llama azul, ventilación libre |
| ⚠️ Atención | Flexible próximo a vencer |
| 🔴 Profesional URGENTE | Olor a gas, llama amarilla, ventilación obstruida |

## Normativa
- NAG-200 — instalaciones de gas como fuente de ignición
- Fuga de gas + chispa = riesgo de explosión`,
      },
    ],
  },
  {
    name: 'Control de Plagas',
    icon: '🐛',
    description: 'Prevención y control de plagas urbanas',
    displayOrder: 11,
    tasks: [
      {
        name: 'Inspección general de indicios de plagas',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Recorrer la vivienda buscando indicios de plagas: excrementos, roeduras, nidos, senderos de hormigas, telas de araña excesivas, cucarachas.',
        priority: 'MEDIUM',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 30,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Excrementos de roedores (pequeños, oscuros, en rincones)
- Caminos de hormigas o presencia de cucarachas
- Sonidos en paredes o techos (roedores en entretecho)
- Daños en cables, madera, alimentos almacenados
- Nidos (detrás de muebles, en subsuelo, entretecho)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin indicios de plagas |
| ⚠️ Atención | Indicios menores (hormigas aisladas, 1-2 cucarachas) |
| 🔴 Profesional | Excrementos de roedores, daño en cables, nidos |

## Procedimiento
1. Inspeccionar cocina: detrás de electrodomésticos, bajo mesada
2. Inspeccionar subsuelo y entretecho (con linterna)
3. Buscar en rincones y zócalos
4. Verificar despensa/alacena: buscar rastros en alimentos`,
      },
      {
        name: 'Control preventivo de termitas',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Inspeccionar marcos de madera, muebles empotrados, estructuras de techo y zócalos buscando túneles de barro, madera hueca o alas descartadas de termitas.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Polvo fino al pie de marcos o muebles de madera (indicio clave)
- Madera que suena hueca al golpear
- Túneles de barro en cimientos o muros (termitas subterráneas)
- Alas descartadas cerca de ventanas (enjambre)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin indicios de termitas |
| ⚠️ Atención | Polvo fino sospechoso, verificar origen |
| 🔴 Profesional URGENTE | Túneles de barro, madera hueca, enjambre |

## Importante
**Requiere empresa especializada** en control de termitas. El daño puede ser extenso antes de ser visible.

## Normativa
- Empresa habilitada por autoridad sanitaria municipal`,
      },
      {
        name: 'Desinsectación preventiva',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Aplicación profesional de insecticida en perímetro, cañerías, bajo mesadas y puntos críticos. Productos aprobados por ANMAT.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 90,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Presencia de cucarachas (especialmente en cocina y baño)
- Hormigueros en jardín cercanos a la casa
- Arañas en rincones, sótano, garaje
- Polillas en roperos o despensa

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin presencia significativa de insectos |
| ⚠️ Atención | Algunos insectos aislados, tratamiento preventivo recomendado |
| 🔴 Profesional | Infestación, cucarachas frecuentes, hormiguero en cimientos |

## Nota
Se recomienda desinsectación preventiva **anual** por empresa habilitada.

## Normativa
- Ley 11843 — servicios de desinsectación
- Empresa registrada ante autoridad sanitaria`,
      },
      {
        name: 'Desratización preventiva',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Colocación de estaciones de cebo y sellado de posibles ingresos. Verificar que no haya fuentes de alimento accesibles para roedores.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 60,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Excrementos (granos oscuros de ~1cm)
- Marcas de dientes en cables, madera, plástico
- Sonidos nocturnos en entretecho o paredes
- Madrigueras (acumulación de materiales en rincones)

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin indicios de roedores |
| ⚠️ Atención | Indicios leves, colocar trampas de monitoreo |
| 🔴 Profesional | Excrementos frecuentes, daño en cables, madriguera |

## PELIGRO
Los roedores pueden transmitir enfermedades (hantavirus, leptospirosis) y causar incendios al roer cables eléctricos.

## Normativa
- Ley 11843 — desratización obligatoria
- NO usar veneno sin asesoramiento (riesgo para mascotas y niños)`,
      },
      {
        name: 'Eliminación de criaderos de mosquitos',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Eliminar recipientes con agua estancada: cubiertas, platos de macetas, baldes, canaletas obstruidas. Aplicar larvicida en desagües. Crítico para prevención de dengue en Litoral.',
        priority: 'HIGH',
        recurrenceType: 'MONTHLY',
        recurrenceMonths: 1,
        estimatedDurationMinutes: 20,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Recipientes con agua estancada (macetas, tapas, neumáticos)
- Canaletas obstruidas con agua acumulada
- Bebederos de mascotas sin renovar
- Piletas fuera de uso con agua estancada

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin agua estancada, recipientes dados vuelta |
| ⚠️ Atención | Algunos recipientes con agua, necesitan vaciarse |
| 🔴 Profesional | Pileta fuera de uso con agua verde, múltiples criaderos |

## Procedimiento
1. Recorrer jardín buscando TODO recipiente con agua
2. Dar vuelta o perforar recipientes que junten agua
3. Renovar agua de bebederos cada 2-3 días
4. Verificar canaletas sin pendiente (agua estancada)

## Normativa
- Campaña nacional contra dengue — eliminar criaderos de Aedes aegypti`,
      },
      {
        name: 'Control de murciélagos',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar si hay colonia de murciélagos en entretechos, aleros o persianas. No eliminar (especie protegida) pero sellar accesos con exclusión. Riesgo de rabia.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'EXTERIOR',
        inspectionGuide: `## Qué buscar
- Presencia de murciélagos en entretecho, aleros, persianas
- Guano (excremento) acumulado en pisos o paredes
- Sonidos al atardecer (chillidos agudos)
- Puntos de ingreso: rendijas >1.5cm en aleros y techos

## Cómo evaluar
| Estado | Criterio |
|--------|----------|
| ✅ OK | Sin presencia de murciélagos |
| ⚠️ Atención | 1-2 avistamientos, posible colonia pequeña |
| 🔴 Profesional | Colonia establecida, guano acumulado |

## Importante
**NO manipular murciélagos con las manos** (riesgo de rabia). Consultar a zoonosis municipal para exclusión humanitaria.

## Normativa
- Zoonosis municipal — protocolo de exclusión de murciélagos
- Los murciélagos son fauna protegida — NO se pueden matar`,
      },
    ],
  },
  {
    name: 'Pisos y Contrapisos',
    icon: '🧱',
    description: 'Estado de pisos, contrapisos, juntas y nivelación',
    displayOrder: 12,
    tasks: [
      {
        name: 'Inspección general de pisos',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Recorrer todos los ambientes verificando pisos: nivelación (usar nivel de burbuja o bolita), baldosas flojas (golpear suavemente y escuchar sonido hueco = despegada), juntas deterioradas, fisuras en contrapiso. En pisos de madera: buscar tablas que crujan, signos de humedad (decoloración, hinchazón), presencia de polvo fino (termitas). En baños y cocina: verificar sellado con silicona en perímetro. ATENCIÓN si: baldosas flojas o juntas faltantes. PROFESIONAL si: desnivel progresivo (puede indicar asentamiento) o signos de termitas.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Verificación de contrapiso y nivelación',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar que no haya hundimientos o levantamientos en el contrapiso. Controlar pendientes hacia desagües en áreas húmedas.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 45,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Sellado de juntas de dilatación en pisos',
        taskType: 'SEALING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Inspeccionar y renovar sellador en juntas de dilatación de pisos. Evitar ingreso de agua y acumulación de suciedad.',
        priority: 'LOW',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 45,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Tratamiento de pisos de madera o parquet',
        taskType: 'TREATMENT',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Lijar y plastificar cuando el desgaste lo requiera. Reparar tablas sueltas. Verificar que no haya humedad debajo (contrapiso).',
        priority: 'MEDIUM',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 48,
        estimatedDurationMinutes: 480,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Limpieza y sellado de pisos de piedra natural',
        taskType: 'CLEANING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Limpiar con producto específico. Aplicar sellador en piedras naturales (mármol, granito, travertino) para evitar manchas y deterioro.',
        priority: 'LOW',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
        defaultSector: 'INTERIOR',
      },
    ],
  },
  {
    name: 'Mobiliario y Equipamiento Fijo',
    icon: '🪑',
    description:
      'Inspección de muebles fijos, mesadas, sanitarios y artefactos integrados a la vivienda',
    displayOrder: 13,
    tasks: [
      {
        name: 'Inspección de alacenas y bajo-mesadas',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar bisagras, estantes, fondo de muebles en busca de humedad, hinchazón de melamina o signos de termitas. Verificar que las puertas cierren correctamente.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'KITCHEN',
      },
      {
        name: 'Inspección de mesada y bacha',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar sellado de la mesada contra la pared (silicona o junta). Revisar estado de la bacha, desagüe y griferías. Buscar manchas de humedad debajo.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 15,
        defaultSector: 'KITCHEN',
      },
      {
        name: 'Limpieza de filtros de extractor de cocina',
        taskType: 'CLEANING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Retirar filtros de grasa del extractor/campana, lavar con desengrasante, secar y reinstalar. Verificar que el motor funcione correctamente.',
        priority: 'MEDIUM',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 20,
        defaultSector: 'KITCHEN',
      },
      {
        name: 'Inspección de campana extractora',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar estado del motor, ducto de salida al exterior, conexión eléctrica y fijación a pared. Verificar que la extracción sea efectiva (prueba con papel).',
        priority: 'LOW',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 15,
        defaultSector: 'KITCHEN',
      },
      {
        name: 'Inspección de mueble de baño/vanitory',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar estado del mueble: humedad, hinchazón, bisagras, sellado contra pared. Verificar que no haya pérdidas en las conexiones debajo del lavatorio.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 15,
        defaultSector: 'BATHROOM',
      },
      {
        name: 'Control de mecanismo de descarga de inodoro',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar funcionamiento del botón/palanca de descarga. Escuchar si el agua sigue corriendo después de la descarga (indica pérdida en la válvula). Revisar flotante.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 10,
        defaultSector: 'BATHROOM',
      },
      {
        name: 'Verificación de fijación de sanitarios',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar que inodoro y bidet estén firmes al piso (sin movimiento). Revisar sellado de la base con silicona. Buscar signos de pérdida de agua alrededor.',
        priority: 'LOW',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 10,
        defaultSector: 'BATHROOM',
      },
      {
        name: 'Control de conexiones de lavarropas',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Revisar canilla de paso (apertura/cierre), manguera de entrada (sin fisuras ni hinchazón), desagüe (sin obstrucciones) y nivel del equipo.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 10,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Control de termotanque eléctrico',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar estado de la resistencia eléctrica, ánodo de magnesio, válvula de seguridad T&P. Drenar sedimentos del fondo.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Inspección de lavavajillas',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar mangueras de entrada y salida, filtro del fondo, brazo aspersor, juntas de la puerta. Limpiar con ciclo vacío y vinagre.',
        priority: 'LOW',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 15,
        defaultSector: 'KITCHEN',
      },
    ],
  },
  {
    name: 'Gas Envasado (GLP)',
    icon: '🔶',
    description: 'Mantenimiento de instalaciones de gas envasado en garrafa o granel',
    displayOrder: 14,
    tasks: [
      {
        name: 'Inspección de regulador de presión de GLP',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar estado del regulador: fecha de vencimiento (5 años), ausencia de pérdidas (agua jabonosa), presión de salida correcta.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Control de válvulas y conexiones flexibles GLP',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de mangueras flexibles (fecha de vencimiento, sin grietas ni torceduras), abrazaderas y válvulas de corte. Norma NAG-200.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 15,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Verificación de ubicación y ventilación del tanque GLP',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Asegurar que el tanque de GLP esté en exterior ventilado, alejado de fuentes de calor y desagües. Verificar base/soporte y accesibilidad.',
        priority: 'HIGH',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 10,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Prueba de hermeticidad de instalación GLP',
        taskType: 'TEST',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Prueba con agua jabonosa o manómetro en toda la instalación de GLP. Obligatoria tras cualquier modificación.',
        priority: 'URGENT',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INSTALLATIONS',
      },
    ],
  },
  {
    name: 'Agua de Pozo',
    icon: '🚰',
    description: 'Mantenimiento de perforaciones y sistemas de agua de pozo',
    displayOrder: 15,
    tasks: [
      {
        name: 'Análisis fisicoquímico y bacteriológico de agua',
        taskType: 'TEST',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Tomar muestra y enviar a laboratorio. Verificar potabilidad: arsénico (común en llanura pampeana), nitratos, coliformes, dureza. Código Alimentario Argentino.',
        priority: 'URGENT',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Service de bomba sumergible',
        taskType: 'ADJUSTMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar caudal, presión, consumo eléctrico, estado de cables. Limpiar filtro de pie. Medir nivel estático y dinámico del pozo.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Control de brocal y sellado de perforación',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar que el brocal (cabezal del pozo) esté sellado para evitar contaminación superficial. Verificar que no haya fuentes contaminantes cercanas.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Mantenimiento de equipo de tratamiento de agua',
        taskType: 'ADJUSTMENT',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar filtros, resinas de ablandador, lámpara UV, ósmosis inversa. Reemplazar consumibles según indicación del fabricante.',
        priority: 'MEDIUM',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 20,
        defaultSector: 'INSTALLATIONS',
      },
    ],
  },
  {
    name: 'Energía Solar y Sustentable',
    icon: '☀️',
    description: 'Mantenimiento de paneles solares, termotanque solar y sistemas sustentables',
    displayOrder: 16,
    tasks: [
      {
        name: 'Limpieza de paneles solares fotovoltaicos',
        taskType: 'CLEANING',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Limpiar con agua desmineralizada y paño suave. El polvo, hojas y excrementos de pájaros reducen rendimiento hasta 25%. Verificar sombras nuevas.',
        priority: 'MEDIUM',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 30,
        defaultSector: 'ROOF',
      },
      {
        name: 'Inspección de sistema fotovoltaico completo',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar inversor (indicadores, ventilación), conexiones (corrosión, ajuste), cableado, estructura de soporte (oxidación, fijación al techo). Medir rendimiento vs esperado.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
        defaultSector: 'ROOF',
      },
      {
        name: 'Control de termotanque solar',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar estado de colectores (vidrio, absorsor), tanque acumulador (ánodo, válvulas), cañerías y anticongelante (si usa glicol). Limpiar colectores.',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
        defaultSector: 'ROOF',
      },
      {
        name: 'Verificación de sistema de recolección de agua de lluvia',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Limpiar filtros, verificar estado de tanque de almacenamiento, bomba, first-flush diverter. Controlar calidad del agua almacenada.',
        priority: 'MEDIUM',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 20,
        defaultSector: 'GARDEN',
      },
      {
        name: 'Inspección de sistema de reciclado de aguas grises',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar filtros, bomba, calidad del agua tratada, estado de cañerías diferenciadas (color violeta según normativa).',
        priority: 'MEDIUM',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
        defaultSector: 'INSTALLATIONS',
      },
    ],
  },
  {
    name: 'Domótica y Electrónica',
    icon: '📡',
    description: 'Mantenimiento de alarmas, cámaras, porteros y automatización',
    displayOrder: 17,
    tasks: [
      {
        name: 'Control de sistema de alarma',
        taskType: 'TEST',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar funcionamiento de todos los sensores (apertura, movimiento, rotura de vidrio), sirena, batería de respaldo, comunicación con monitoreo.',
        priority: 'HIGH',
        recurrenceType: 'MONTHLY',
        recurrenceMonths: 1,
        estimatedDurationMinutes: 15,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Inspección de cámaras de seguridad',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar imagen de cada cámara, grabación, almacenamiento (disco/nube), estado de cableado, limpieza de lente, visión nocturna.',
        priority: 'MEDIUM',
        recurrenceType: 'QUARTERLY',
        recurrenceMonths: 3,
        estimatedDurationMinutes: 20,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Mantenimiento de portero eléctrico o videoportero',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar audio, video (si tiene), apertura eléctrica de puerta, cableado. Limpiar contactos de la botonera exterior.',
        priority: 'LOW',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 15,
        defaultSector: 'INSTALLATIONS',
      },
      {
        name: 'Control de automatización del hogar',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar funcionamiento de luces automáticas, cortinas motorizadas, termostatos inteligentes, hub central. Actualizar firmware. Verificar batería de sensores inalámbricos.',
        priority: 'LOW',
        recurrenceType: 'BIANNUAL',
        recurrenceMonths: 6,
        estimatedDurationMinutes: 30,
        defaultSector: 'INSTALLATIONS',
      },
    ],
  },
  {
    name: 'Cielorraso y Entrepisos',
    icon: '🏛',
    description: 'Mantenimiento de cielorrasos, entrepisos y entretechos',
    displayOrder: 18,
    tasks: [
      {
        name: 'Inspección de cielorraso suspendido (durlock/yeso)',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar fisuras en juntas, desprendimientos, manchas de humedad (indica filtración desde arriba), pandeo. Común en construcción argentina moderna.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Control de cielorraso de machimbre',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de la madera: deformaciones, hongos, termitas, fijación de tablas. Aplicar protector si corresponde.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Inspección de entretecho',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Acceder al espacio entre techo y cielorraso: verificar estado de estructura (cabriadas/tirantería), aislación térmica, presencia de plagas (murciélagos, avispas), cañerías.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'ROOF',
      },
      {
        name: 'Control de entrepiso de madera',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
        technicalDescription:
          'Verificar estado de vigas, machimbre o tablero inferior, crujidos excesivos, flexión. Buscar signos de termitas o pudrición.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INTERIOR',
      },
    ],
  },
  {
    name: 'Protección contra Rayos',
    icon: '🌩',
    description: 'Pararrayos y protección contra descargas atmosféricas',
    displayOrder: 19,
    tasks: [
      {
        name: 'Inspección de pararrayos',
        taskType: 'INSPECTION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar estado del captor, cable de bajada, puesta a tierra, conexiones. Medir resistencia de puesta a tierra dedicada (<10 ohms). Norma IRAM 2184.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 45,
        defaultSector: 'ROOF',
      },
      {
        name: 'Control post-tormenta eléctrica',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Tras tormenta eléctrica severa: verificar funcionamiento de artefactos electrónicos, disyuntor diferencial, dispositivos de protección contra sobretensiones (DPS).',
        priority: 'HIGH',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'ROOF',
      },
      {
        name: 'Verificación de equipotencialización',
        taskType: 'MEASUREMENT',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar que cañerías metálicas, estructuras metálicas, puesta a tierra y pararrayos estén vinculados al mismo sistema de puesta a tierra. Norma AEA 90364.',
        priority: 'HIGH',
        recurrenceType: 'CUSTOM',
        recurrenceMonths: 36,
        estimatedDurationMinutes: 45,
        defaultSector: 'ROOF',
      },
    ],
  },
  {
    name: 'Escaleras y Barandas',
    icon: '🪜',
    description: 'Mantenimiento de escaleras, barandas y accesos a terraza',
    displayOrder: 20,
    tasks: [
      {
        name: 'Inspección de escalera interior y exterior',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar estado de escalones (fisuras, desprendimientos, antideslizante), estructura, iluminación. En escaleras exteriores: verificar pendiente de escurrimiento.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 20,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Control de barandas y pasamanos',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar fijación firme (no deben tener juego), altura mínima (0.90m interior, 1.00m exterior según código de edificación), estado de soldaduras o fijaciones.',
        priority: 'HIGH',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 15,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Mantenimiento de escalera de acceso a terraza',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar fijación a muro, estado de peldaños, oxidación. Agregar antideslizante si no tiene. Aplica a escaleras marineras o de gato.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 15,
        defaultSector: 'TERRACE',
      },
    ],
  },
  {
    name: 'Documentación y Normativa',
    icon: '📋',
    description: 'Gestión de certificados, habilitaciones y documentación de la vivienda',
    displayOrder: 21,
    tasks: [
      {
        name: 'Renovación de certificado de gas (oblea)',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Tramitar renovación de la oblea de gas ante la distribuidora. Requiere inspección por gasista matriculado. Obligatorio según NAG-200/226.',
        priority: 'URGENT',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 24,
        estimatedDurationMinutes: 90,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Actualización de planos de instalaciones',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Mantener planos actualizados de instalación eléctrica, sanitaria y gas ante cualquier modificación. Requerido por código de edificación para trámites municipales.',
        priority: 'MEDIUM',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 120,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Revisión de póliza de seguro del hogar',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Verificar cobertura vigente, actualización de suma asegurada (por inflación), cobertura de eventos climáticos (granizo, inundación), responsabilidad civil.',
        priority: 'MEDIUM',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Verificación de habilitación municipal',
        taskType: 'EVALUATION',
        professionalRequirement: 'PROFESSIONAL_REQUIRED',
        technicalDescription:
          'Verificar que ampliaciones o modificaciones cuenten con permiso de obra municipal. Las obras sin habilitación afectan la cobertura del seguro y el valor de la propiedad.',
        priority: 'MEDIUM',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 60,
        defaultSector: 'INTERIOR',
      },
      {
        name: 'Archivo de comprobantes de mantenimiento',
        taskType: 'INSPECTION',
        professionalRequirement: 'OWNER_CAN_DO',
        technicalDescription:
          'Archivar facturas, certificados y registros fotográficos de todos los mantenimientos realizados. Útil para seguro, venta y seguimiento histórico.',
        priority: 'LOW',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        estimatedDurationMinutes: 30,
        defaultSector: 'INTERIOR',
      },
    ],
  },
];
