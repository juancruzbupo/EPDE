/* eslint-disable @typescript-eslint/ban-ts-comment, no-console */
// @ts-nocheck — Seed script, array indexing returns T|undefined in strict mode
// ============================================================================
// apps/api/prisma/seed-demo.ts
//
// Seed de datos demo con 3 usuarios en diferentes etapas de uso:
//   1. María González  — Veterana (18 meses), casa antigua, historial rico
//   2. Carlos Rodríguez — Intermedio (6 meses), casa moderna, uso regular
//   3. Laura Fernández  — Nueva (1 mes), casa recién construida, sin historial
//
// Ejecutar: npx prisma db seed
// Requiere: templates ya creados (seed.ts principal debe correr primero)
// ============================================================================

import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const BCRYPT_SALT_ROUNDS = 12;

// —— Helpers ——————————————————————————————————————————————————————————————————

/** Fecha relativa al momento del seed (siempre actual). */
const SEED_NOW = new Date();

function daysAgo(days: number): Date {
  const d = new Date(SEED_NOW);
  d.setDate(d.getDate() - days);
  return d;
}

function monthsAgo(months: number): Date {
  const d = new Date(SEED_NOW);
  d.setMonth(d.getMonth() - months);
  return d;
}

function monthsFromNow(months: number): Date {
  const d = new Date(SEED_NOW);
  d.setMonth(d.getMonth() + months);
  return d;
}

// —— IDs pre-generados para referencias cruzadas ————————————————————————————

const ids = {
  maria: randomUUID(),
  carlos: randomUUID(),
  laura: randomUUID(),

  mariaProp: randomUUID(),
  carlosProp: randomUUID(),
  lauraProp: randomUUID(),

  mariaInspection: randomUUID(),
  carlosInspection: randomUUID(),
  lauraInspection: randomUUID(),

  mariaPlan: randomUUID(),
  carlosPlan: randomUUID(),
  lauraPlan: randomUUID(),
};

// ============================================================================
// CATEGORÍAS (globales, compartidas entre propiedades)
// ============================================================================

// Names MUST match CATEGORY_DEFAULTS in seed.ts / TEMPLATE_SEED_DATA in shared (FK linked at seed time)
const CATEGORIES = [
  { name: 'Estructura', icon: '🏗', description: 'Control estructural de la vivienda' },
  {
    name: 'Techos y Cubiertas',
    icon: '🏠',
    description: 'Mantenimiento de cubiertas, canaletas y membranas',
  },
  {
    name: 'Pintura y Revestimientos',
    icon: '🧱',
    description: 'Control de humedad, revoques, pintura y revestimientos',
  },
  {
    name: 'Instalación Sanitaria',
    icon: '🚰',
    description: 'Cañerías, griferías, tanques y desagües',
  },
  {
    name: 'Instalación Eléctrica',
    icon: '⚡',
    description: 'Tablero, disyuntores, puesta a tierra',
  },
  {
    name: 'Gas y Calefacción',
    icon: '🔥',
    description: 'Artefactos, ventilaciones y hermeticidad',
  },
  {
    name: 'Aberturas',
    icon: '🪟',
    description: 'Herrajes, burletes, selladores, puertas y ventanas',
  },
  {
    name: 'Climatización',
    icon: '❄️',
    description: 'Aire acondicionado, ventilación y aislación térmica',
  },
  {
    name: 'Jardín y Exteriores',
    icon: '🌳',
    description: 'Perímetro, veredas, raíces, desagües de patio',
  },
  {
    name: 'Humedad e Impermeabilización',
    icon: '💧',
    description: 'Control de humedad, impermeabilización y aislación hidrófuga',
  },
  {
    name: 'Seguridad contra Incendio',
    icon: '🧯',
    description: 'Detección de humo, matafuegos y prevención de incendios',
  },
  {
    name: 'Control de Plagas',
    icon: '🐛',
    description: 'Prevención y control de plagas urbanas',
  },
  {
    name: 'Pisos y Contrapisos',
    icon: '🧱',
    description: 'Estado de pisos, contrapisos, juntas y nivelación',
  },
] as const;

// —— Definición completa de las 71 tareas del template ———————————————————————

interface TaskDef {
  name: string;
  taskType: string;
  professionalRequirement: string;
  technicalDescription: string;
  priority: string;
  recurrenceType: string;
  recurrenceMonths: number;
  estimatedDurationMinutes: number;
  categoryIndex: number;
  /** Override the category default sector. If omitted, CATEGORY_DEFAULT_SECTOR is used. */
  sector?: string;
}

/** Default sector mapping by category — most tasks in a category share a natural sector. */
const CATEGORY_DEFAULT_SECTOR: Record<number, string> = {
  0: 'INTERIOR', // Estructura → varies, default Interior
  1: 'ROOF', // Techos y Cubiertas
  2: 'EXTERIOR', // Pintura y Revestimientos
  3: 'BATHROOM', // Instalación Sanitaria
  4: 'INSTALLATIONS', // Instalación Eléctrica
  5: 'INSTALLATIONS', // Gas y Calefacción
  6: 'EXTERIOR', // Aberturas
  7: 'INSTALLATIONS', // Climatización
  8: 'GARDEN', // Jardín y Exteriores
  9: 'BASEMENT', // Humedad e Impermeabilización
  10: 'INSTALLATIONS', // Seguridad contra Incendio
  11: 'EXTERIOR', // Control de Plagas
  12: 'INTERIOR', // Pisos y Contrapisos
};

const TASK_DEFS: TaskDef[] = [
  // —— 0. ESTRUCTURA (10 tareas) ——
  {
    name: 'Inspección visual de vigas y columnas',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Revisar visualmente vigas y columnas en busca de fisuras, manchas de humedad o deformaciones.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 0,
  },
  {
    name: 'Revisión de fisuras en muros portantes',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription:
      'Inspeccionar muros portantes. Documentar fisuras nuevas con fotos y mediciones.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 45,
    categoryIndex: 0,
  },
  {
    name: 'Medición y seguimiento de grietas activas',
    taskType: 'MEASUREMENT',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Medir grietas con fisurómetro. Comparar con mediciones anteriores.',
    priority: 'HIGH',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 30,
    categoryIndex: 0,
  },
  {
    name: 'Control de asentamientos diferenciales',
    taskType: 'MEASUREMENT',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription: 'Verificar nivelación y posibles asentamientos mediante referencia fija.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 60,
    categoryIndex: 0,
  },
  {
    name: 'Verificación de armaduras expuestas',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription:
      'Inspeccionar zonas con armaduras a la vista. Evaluar nivel de oxidación.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 0,
  },
  {
    name: 'Control de desprendimientos de hormigón',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Detectar zonas de hormigón suelto o con principio de desprendimiento.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 20,
    categoryIndex: 0,
  },
  {
    name: 'Revisión de juntas estructurales',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Controlar estado de juntas de dilatación estructurales.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 0,
  },
  {
    name: 'Evaluación profesional estructural integral',
    taskType: 'EVALUATION',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription: 'Evaluación completa por ingeniero estructural matriculado.',
    priority: 'HIGH',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 60,
    estimatedDurationMinutes: 180,
    categoryIndex: 0,
  },

  // —— 1. TECHOS Y CUBIERTAS (10 tareas) ——
  {
    name: 'Limpieza de canaletas',
    taskType: 'CLEANING',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Retirar hojas, tierra y sedimentos de canaletas perimetrales.',
    priority: 'MEDIUM',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 60,
    categoryIndex: 1,
  },
  {
    name: 'Limpieza de bajadas pluviales',
    taskType: 'CLEANING',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Verificar y limpiar bajadas pluviales con agua a presión.',
    priority: 'MEDIUM',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 45,
    categoryIndex: 1,
  },
  {
    name: 'Revisión de impermeabilización de terrazas',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Inspeccionar membrana, buscar ampollas, fisuras o despegues.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 45,
    categoryIndex: 1,
    sector: 'TERRACE',
  },
  {
    name: 'Inspección de membranas asfálticas',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Controlar solapes, sellos y estado general de membranas.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 40,
    categoryIndex: 1,
  },
  {
    name: 'Revisión de sellados y babetas',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Verificar selladores en encuentros de techo con muros y chimeneas.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 1,
  },
  {
    name: 'Control de pendientes y escurrimiento',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Verificar que las pendientes aseguren correcto escurrimiento.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 1,
  },
  {
    name: 'Inspección estructura de madera (xilófagos)',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription:
      'Inspeccionar tirantes y cabriadas en busca de daño por termitas o polilla.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 60,
    categoryIndex: 1,
  },
  {
    name: 'Tratamiento preventivo madera',
    taskType: 'TREATMENT',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription:
      'Aplicar tratamiento curasivo/preventivo antipolilla en estructura de madera.',
    priority: 'MEDIUM',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 24,
    estimatedDurationMinutes: 120,
    categoryIndex: 1,
  },
  {
    name: 'Revisión techo de chapa (tornillos y fijaciones)',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Verificar tornillos, arandelas y fijaciones del techo de chapa.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 45,
    categoryIndex: 1,
  },

  // —— 2. PINTURA Y REVESTIMIENTOS (6 + 3 pisos = 9 tareas) ——
  {
    name: 'Control de humedad ascendente',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription:
      'Inspeccionar zócalos y bases de muros. Medir con higrómetro si hay sospecha.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 40,
    categoryIndex: 2,
  },
  {
    name: 'Revisión de revoques exteriores',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Golpear suavemente revoques exteriores buscando zonas huecas o desprendidas.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 2,
  },
  {
    name: 'Control de pintura exterior',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Evaluar estado de pintura: descascaramiento, ampollas, decoloración.',
    priority: 'LOW',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 20,
    categoryIndex: 2,
  },
  {
    name: 'Repintado exterior completo',
    taskType: 'TREATMENT',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Preparación de superficie y aplicación de pintura exterior completa.',
    priority: 'MEDIUM',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 48,
    estimatedDurationMinutes: 480,
    categoryIndex: 2,
  },
  {
    name: 'Sellado de fisuras no estructurales',
    taskType: 'SEALING',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Sellar fisuras finas en revoques con sellador elastomérico.',
    priority: 'LOW',
    recurrenceType: 'ON_DETECTION',
    recurrenceMonths: 0,
    estimatedDurationMinutes: 30,
    categoryIndex: 2,
  },
  {
    name: 'Control de moho en interiores',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Inspeccionar rincones, detrás de muebles y zonas húmedas en busca de moho.',
    priority: 'MEDIUM',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 20,
    categoryIndex: 2,
  },

  // —— 3. INSTALACIÓN SANITARIA (8 tareas) ——
  {
    name: 'Revisión de pérdidas en griferías',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Verificar goteos en canillas, duchas, llaves de paso y conexiones.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 3,
  },
  {
    name: 'Control de presión de agua',
    taskType: 'TEST',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Abrir varias canillas simultáneamente y verificar presión adecuada.',
    priority: 'LOW',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 15,
    categoryIndex: 3,
  },
  {
    name: 'Limpieza de tanque de agua',
    taskType: 'CLEANING',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Vaciar, cepillar y desinfectar tanque con lavandina. Enjuagar.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 120,
    categoryIndex: 3,
  },
  {
    name: 'Revisión de desagües pluviales',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Verificar que todos los desagües pluviales escurran correctamente.',
    priority: 'MEDIUM',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 20,
    categoryIndex: 3,
  },
  {
    name: 'Inspección de cámaras cloacales',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Abrir tapas de cámaras, verificar nivel de agua y estado de caños.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 3,
  },
  {
    name: 'Prueba de estanqueidad en cañerías ocultas',
    taskType: 'TEST',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription: 'Presurizar cañerías y verificar que no haya pérdidas ocultas.',
    priority: 'HIGH',
    recurrenceType: 'ON_DETECTION',
    recurrenceMonths: 0,
    estimatedDurationMinutes: 90,
    categoryIndex: 3,
  },

  // —— 4. INSTALACIÓN ELÉCTRICA (5 tareas) ——
  {
    name: 'Revisión de tablero eléctrico',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription:
      'Inspeccionar tablero: estado de térmicas, cableado, señalización de circuitos.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 4,
  },
  {
    name: 'Prueba de disyuntor diferencial',
    taskType: 'TEST',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Presionar botón de test del diferencial. Debe cortar inmediatamente.',
    priority: 'HIGH',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 5,
    categoryIndex: 4,
  },
  {
    name: 'Verificación de puesta a tierra',
    taskType: 'TEST',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription:
      'Medir resistencia de puesta a tierra con telurímetro. Debe ser < 10 ohm.',
    priority: 'HIGH',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 24,
    estimatedDurationMinutes: 30,
    categoryIndex: 4,
  },
  {
    name: 'Ajuste de borneras',
    taskType: 'ADJUSTMENT',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Reapretar todas las borneras del tablero eléctrico.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 20,
    categoryIndex: 4,
  },
  {
    name: 'Inspección de sobrecargas',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Verificar que no haya zapatillas sobrecargadas ni cables recalentados.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 20,
    categoryIndex: 4,
  },

  // —— 5. GAS Y CALEFACCIÓN (4 tareas) ——
  {
    name: 'Revisión de artefactos a gas',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription:
      'Revisar calefones, estufas, cocina, termotanque. Verificar llama y tiraje.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 45,
    categoryIndex: 5,
    sector: 'KITCHEN',
  },
  {
    name: 'Control de ventilaciones reglamentarias',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Verificar rejillas de ventilación inferior y superior en ambientes con gas.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 15,
    categoryIndex: 5,
  },
  {
    name: 'Prueba de hermeticidad por gasista matriculado',
    taskType: 'TEST',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription:
      'Ensayo de hermeticidad de toda la instalación de gas por profesional matriculado.',
    priority: 'URGENT',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 24,
    estimatedDurationMinutes: 60,
    categoryIndex: 5,
  },

  // —— 6. ABERTURAS (4 tareas) ——
  {
    name: 'Lubricación de herrajes',
    taskType: 'LUBRICATION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Aplicar lubricante en bisagras, cerraduras y rieles de todas las aberturas.',
    priority: 'LOW',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 6,
  },
  {
    name: 'Revisión de burletes',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Verificar estado de burletes. Detectar filtraciones de aire y agua.',
    priority: 'LOW',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 20,
    categoryIndex: 6,
  },
  {
    name: 'Reposición de selladores exteriores',
    taskType: 'SEALING',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Retirar sellador viejo y aplicar nuevo sellador de silicona en marcos exteriores.',
    priority: 'MEDIUM',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 30,
    estimatedDurationMinutes: 60,
    categoryIndex: 6,
  },
  {
    name: 'Ajuste de puertas y ventanas',
    taskType: 'ADJUSTMENT',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Regular puertas y ventanas que rozan, no cierran o tienen juego excesivo.',
    priority: 'LOW',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 6,
  },

  // —— 7. CLIMATIZACIÓN (3 tareas) ——
  {
    name: 'Limpieza de filtros de aire acondicionado',
    taskType: 'CLEANING',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Retirar filtros, lavar con agua y jabón neutro, secar y reinstalar.',
    priority: 'MEDIUM',
    recurrenceType: 'QUARTERLY',
    recurrenceMonths: 3,
    estimatedDurationMinutes: 20,
    categoryIndex: 7,
  },
  {
    name: 'Service de aire acondicionado',
    taskType: 'CLEANING',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription:
      'Limpieza de evaporador y condensador, carga de gas si necesario, verificación eléctrica.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 90,
    categoryIndex: 7,
  },
  {
    name: 'Control de ventilación natural',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Verificar que rejillas de ventilación no estén obstruidas. Controlar tiraje de ventilaciones.',
    priority: 'LOW',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 15,
    categoryIndex: 7,
  },

  // —— Pisos y revestimientos (ahora bajo Pintura y Revestimientos, index 2) ——
  {
    name: 'Revisión de juntas de dilatación en pisos',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Inspeccionar juntas de dilatación en pisos. Verificar que no estén rotas o faltantes.',
    priority: 'LOW',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 20,
    categoryIndex: 2,
  },
  {
    name: 'Control de desprendimiento de cerámicos',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Golpear cerámicos buscando piezas sueltas, especialmente en baños y cocina.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 20,
    categoryIndex: 2,
  },
  {
    name: 'Sellado de juntas húmedas (baños/cocina)',
    taskType: 'SEALING',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Renovar sellador de silicona en juntas de bañera, ducha y mesada.',
    priority: 'MEDIUM',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 24,
    estimatedDurationMinutes: 45,
    categoryIndex: 2,
    sector: 'BATHROOM',
  },

  // —— 8. JARDÍN Y EXTERIORES (4 tareas) ——
  {
    name: 'Control de pendientes perimetrales',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Verificar que el terreno alrededor de la casa tenga pendiente hacia afuera.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 20,
    categoryIndex: 8,
  },
  {
    name: 'Revisión de veredas y solados exteriores',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Inspeccionar hundimientos, fisuras y levantamientos en veredas.',
    priority: 'LOW',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 15,
    categoryIndex: 8,
  },
  {
    name: 'Control de raíces cercanas a fundaciones',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Verificar que raíces de árboles no estén dañando cimientos o cañerías.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 8,
  },
  {
    name: 'Limpieza de desagües de patio',
    taskType: 'CLEANING',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Destapar y limpiar rejillas y conductos de desagüe del patio.',
    priority: 'MEDIUM',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 30,
    categoryIndex: 8,
  },

  // —— Extra tasks for existing categories ——

  // Estructura — missing tasks
  {
    name: 'Control de humedad ascendente en cimientos',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Inspeccionar base de muros buscando humedad ascendente por capilaridad.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 45,
    categoryIndex: 0,
  },
  {
    name: 'Evaluación estructural integral quinquenal',
    taskType: 'EVALUATION',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription: 'Evaluación completa del estado estructural por ingeniero matriculado.',
    priority: 'HIGH',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 60,
    estimatedDurationMinutes: 240,
    categoryIndex: 0,
  },

  // Techos — missing tasks
  {
    name: 'Reemplazo integral de membrana asfáltica',
    taskType: 'TREATMENT',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription: 'Reemplazo completo de membrana asfáltica en techos planos.',
    priority: 'HIGH',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 120,
    estimatedDurationMinutes: 480,
    categoryIndex: 1,
  },

  // Sanitaria — missing tasks
  {
    name: 'Verificación de termotanque y ánodo de sacrificio',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Inspeccionar termotanque: ánodo, válvula de seguridad, conexiones.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 45,
    categoryIndex: 3,
  },
  {
    name: 'Mantenimiento de cámara séptica',
    taskType: 'CLEANING',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription: 'Vaciado y limpieza de cámara séptica por servicio atmosférico.',
    priority: 'HIGH',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 24,
    estimatedDurationMinutes: 120,
    categoryIndex: 3,
  },

  // Gas — missing tasks
  {
    name: 'Revisión periódica obligatoria NAG-226',
    taskType: 'EVALUATION',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription:
      'Inspección obligatoria de toda la instalación de gas por gasista matriculado.',
    priority: 'URGENT',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 24,
    estimatedDurationMinutes: 90,
    categoryIndex: 5,
  },

  // —— 9. HUMEDAD E IMPERMEABILIZACIÓN (4 tareas) ——
  {
    name: 'Inspección de manchas y eflorescencias',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Recorrer muros buscando manchas de humedad, eflorescencias y desprendimientos.',
    priority: 'HIGH',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 30,
    categoryIndex: 9,
  },
  {
    name: 'Control de muros enterrados y subsuelos',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription:
      'Inspeccionar muros de sótano. Verificar impermeabilización y filtraciones.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 60,
    categoryIndex: 9,
  },
  {
    name: 'Verificación de impermeabilización en baños y cocina',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Verificar sellados en duchas, bañeras y mesadas. Buscar filtraciones.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 9,
  },
  {
    name: 'Control de ventilación para prevención de condensación',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Verificar extractores y ventilación natural en baños, cocina y lavadero.',
    priority: 'MEDIUM',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 20,
    categoryIndex: 9,
  },

  // —— 10. SEGURIDAD CONTRA INCENDIO (3 tareas) ——
  {
    name: 'Verificación de detectores de humo',
    taskType: 'TEST',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Presionar botón de test de cada detector. Reemplazar baterías si no funciona.',
    priority: 'HIGH',
    recurrenceType: 'MONTHLY',
    recurrenceMonths: 1,
    estimatedDurationMinutes: 10,
    categoryIndex: 10,
  },
  {
    name: 'Control y recarga de matafuegos',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription:
      'Verificar presión, manguera, precinto y vencimiento. Recargar si corresponde.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 10,
  },
  {
    name: 'Revisión de instalación eléctrica como fuente de ignición',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Verificar cables, empalmes, tableros — riesgos eléctricos de incendio.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 45,
    categoryIndex: 10,
  },

  // —— 11. CONTROL DE PLAGAS (4 tareas) ——
  {
    name: 'Inspección general de indicios de plagas',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription:
      'Buscar excrementos, roeduras, nidos, cucarachas y otros indicios de plagas.',
    priority: 'MEDIUM',
    recurrenceType: 'QUARTERLY',
    recurrenceMonths: 3,
    estimatedDurationMinutes: 30,
    categoryIndex: 11,
  },
  {
    name: 'Control preventivo de termitas',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription: 'Inspeccionar marcos de madera y estructuras buscando daño por termitas.',
    priority: 'HIGH',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 60,
    categoryIndex: 11,
  },
  {
    name: 'Desinsectación preventiva',
    taskType: 'TREATMENT',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription: 'Aplicación profesional de insecticida en perímetro y puntos críticos.',
    priority: 'MEDIUM',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 90,
    categoryIndex: 11,
  },
  {
    name: 'Desratización preventiva',
    taskType: 'TREATMENT',
    professionalRequirement: 'PROFESSIONAL_REQUIRED',
    technicalDescription:
      'Colocación de estaciones de cebo y sellado de posibles ingresos de roedores.',
    priority: 'MEDIUM',
    recurrenceType: 'BIANNUAL',
    recurrenceMonths: 6,
    estimatedDurationMinutes: 60,
    categoryIndex: 11,
  },

  // —— 12. PISOS Y CONTRAPISOS (3 tareas) ——
  {
    name: 'Inspección general de pisos',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Verificar baldosas flojas, desniveles, fisuras y desgaste excesivo.',
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    estimatedDurationMinutes: 30,
    categoryIndex: 12,
  },
  {
    name: 'Verificación de contrapiso y nivelación',
    taskType: 'INSPECTION',
    professionalRequirement: 'PROFESSIONAL_RECOMMENDED',
    technicalDescription:
      'Verificar hundimientos o levantamientos. Controlar pendientes hacia desagües.',
    priority: 'MEDIUM',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 24,
    estimatedDurationMinutes: 45,
    categoryIndex: 12,
  },
  {
    name: 'Sellado de juntas de dilatación en pisos',
    taskType: 'SEALING',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: 'Renovar sellador en juntas de dilatación de pisos.',
    priority: 'LOW',
    recurrenceType: 'CUSTOM',
    recurrenceMonths: 24,
    estimatedDurationMinutes: 45,
    categoryIndex: 12,
  },
];

// ============================================================================
// HELPER: crear TaskLog
// ============================================================================

async function createLog(
  prisma: PrismaClient,
  taskId: string,
  userId: string,
  completedAt: Date,
  result: string,
  condition: string,
  executor: string,
  action: string,
  cost?: number,
  note?: string,
) {
  return prisma.taskLog.create({
    data: {
      taskId,
      completedBy: userId,
      completedAt,
      result: result as never,
      conditionFound: condition as never,
      executor: executor as never,
      actionTaken: action as never,
      cost: cost ? new Prisma.Decimal(cost) : null,
      notes: note ?? null,
    },
  });
}

// ============================================================================
// HELPER: crear tareas para un plan
// ============================================================================

async function createTasksForPlan(
  prisma: PrismaClient,
  planId: string,
  categoryIds: Record<number, string>,
  statusFn: (def: TaskDef, index: number) => { nextDueDate: Date | null; status: string },
  createdAt: Date,
): Promise<{ id: string; def: TaskDef }[]> {
  const tasks: { id: string; def: TaskDef }[] = [];
  for (let i = 0; i < TASK_DEFS.length; i++) {
    const def = TASK_DEFS[i]!;
    const { nextDueDate, status } = statusFn(def, i);

    const task = await prisma.task.create({
      data: {
        maintenancePlanId: planId,
        categoryId: categoryIds[def.categoryIndex]!,
        sector: (def.sector ?? CATEGORY_DEFAULT_SECTOR[def.categoryIndex] ?? null) as never,
        name: def.name,
        taskType: def.taskType as never,
        professionalRequirement: def.professionalRequirement as never,
        technicalDescription: def.technicalDescription,
        priority: def.priority as never,
        recurrenceType: def.recurrenceType as never,
        recurrenceMonths: def.recurrenceMonths || null,
        estimatedDurationMinutes: def.estimatedDurationMinutes,
        nextDueDate,
        status: status as never,
        order: i,
        createdAt,
      },
    });
    tasks.push({ id: task.id, def });
  }
  return tasks;
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

export async function seedDemo(prisma: PrismaClient) {
  console.log('\n🌱 Creando datos demo...\n');

  const passwordHash = await bcrypt.hash('Demo123!', BCRYPT_SALT_ROUNDS);

  // Obtener admin existente
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@epde.com' } });
  console.log(`  ✓ Admin existente: ${admin.email}`);

  // ————————————————————————————————————————————————————————————————————————
  // CATEGORÍAS GLOBALES (compartidas entre todas las propiedades)
  // ————————————————————————————————————————————————————————————————————————

  const categoryIds: Record<number, string> = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const existing = await prisma.category.findFirst({
      where: { name: CATEGORIES[i].name, deletedAt: null },
    });
    if (existing) {
      categoryIds[i] = existing.id;
    } else {
      const cat = await prisma.category.create({
        data: {
          name: CATEGORIES[i].name,
          icon: CATEGORIES[i].icon,
          description: CATEGORIES[i].description,
          order: 10 + i, // offset para no colisionar con las 10 categorías base
        },
      });
      categoryIds[i] = cat.id;
    }
  }
  console.log(`  ✓ ${CATEGORIES.length} categorías demo (compartidas)`);

  // ————————————————————————————————————————————————————————————————————————
  // USUARIO 1: MARÍA GONZÁLEZ — Veterana (18 meses)
  // Casa de 1985, muchas tareas completadas, algunas vencidas,
  // presupuestos aprobados, solicitudes de servicio, notificaciones
  // ————————————————————————————————————————————————————————————————————————

  console.log('\n👤 María González — Veterana (18 meses de uso)');

  const maria = await prisma.user.create({
    data: {
      id: ids.maria,
      email: 'maria.gonzalez@demo.com',
      name: 'María González',
      phone: '+54 11 4555-1234',
      passwordHash,
      role: 'CLIENT',
      status: 'ACTIVE',
      createdAt: monthsAgo(18),
      lastLoginAt: daysAgo(2),
      activatedAt: monthsAgo(18),
      subscriptionExpiresAt: daysAgo(-90),
    },
  });

  const mariaProp = await prisma.property.create({
    data: {
      id: ids.mariaProp,
      userId: maria.id,
      address: 'Av. Libertador 4500',
      city: 'CABA',
      type: 'HOUSE',
      yearBuilt: 1985,
      squareMeters: 220,
      createdAt: monthsAgo(18),
      createdBy: admin.id,
    },
  });

  // Inspección visual que originó el plan (simula flujo inspección → plan)
  const mariaInspection = await prisma.inspectionChecklist.create({
    data: {
      id: ids.mariaInspection,
      propertyId: mariaProp.id,
      inspectedBy: admin.id,
      inspectedAt: monthsAgo(18),
      notes:
        'Casa de 1985. Estructura general buena, algunos puntos de atención en humedad y techo.',
      items: {
        create: [
          { sector: 'EXTERIOR', name: 'Estado general fachada', status: 'OK', order: 0 },
          {
            sector: 'ROOF',
            name: 'Membrana hidrófuga',
            status: 'NEEDS_ATTENTION',
            finding: 'Membrana con desgaste visible en zona NE',
            order: 1,
          },
          { sector: 'INSTALLATIONS', name: 'Tablero eléctrico', status: 'OK', order: 2 },
          { sector: 'INSTALLATIONS', name: 'Instalación de gas', status: 'OK', order: 3 },
          {
            sector: 'BASEMENT',
            name: 'Humedad en cimientos',
            status: 'NEEDS_PROFESSIONAL',
            finding: 'Humedad ascendente en muro medianero sur, eflorescencias visibles',
            order: 4,
          },
          {
            sector: 'INTERIOR',
            name: 'Fisuras en muros',
            status: 'NEEDS_ATTENTION',
            finding: 'Fisura diagonal en muro dormitorio principal, ~1.5mm',
            order: 5,
          },
        ],
      },
    },
  });

  const mariaPlan = await prisma.maintenancePlan.create({
    data: {
      id: ids.mariaPlan,
      propertyId: mariaProp.id,
      name: 'Plan de Mantenimiento Preventivo',
      status: 'ACTIVE',
      sourceInspectionId: mariaInspection.id,
      createdAt: monthsAgo(18),
      createdBy: admin.id,
    },
  });

  // Tareas de María — casa vieja, estados variados
  const mariaTasks = await createTasksForPlan(
    prisma,
    mariaPlan.id,
    categoryIds,
    (def, i) => {
      if (def.recurrenceType === 'ON_DETECTION') return { nextDueDate: null, status: 'PENDING' };
      if (i % 7 === 0) return { nextDueDate: daysAgo(45 + i * 3), status: 'OVERDUE' };
      if (i % 5 === 0) return { nextDueDate: daysAgo(-15 - (i % 4) * 5), status: 'UPCOMING' };
      return {
        nextDueDate: monthsFromNow(Math.min(def.recurrenceMonths || 6, 6)),
        status: 'PENDING',
      };
    },
    monthsAgo(18),
  );
  console.log(`  ✓ Propiedad: ${mariaProp.address} (${mariaProp.city}) — 71 tareas`);

  // —— Task Logs para María (historial rico de 18 meses) ——

  // Ciclo 1 — Sep 2024 (primer control completo)
  const cycle1 = monthsAgo(17);
  await createLog(
    prisma,
    mariaTasks[0].id,
    maria.id,
    cycle1,
    'OK_WITH_OBSERVATIONS',
    'FAIR',
    'EPDE_PROFESSIONAL',
    'INSPECTION_ONLY',
    undefined,
    'Se observan microfisuras en viga del living, monitorear',
  );
  await createLog(
    prisma,
    mariaTasks[1].id,
    maria.id,
    cycle1,
    'NEEDS_ATTENTION',
    'FAIR',
    'EPDE_PROFESSIONAL',
    'INSPECTION_ONLY',
    undefined,
    'Fisura horizontal en muro medianero norte, 0.3mm',
  );
  await createLog(
    prisma,
    mariaTasks[8].id,
    maria.id,
    cycle1,
    'OK',
    'FAIR',
    'OWNER',
    'CLEANING',
    undefined,
    'Canaletas con acumulación de hojas, limpiadas',
  );
  await createLog(prisma, mariaTasks[9].id, maria.id, cycle1, 'OK', 'GOOD', 'OWNER', 'CLEANING');
  await createLog(
    prisma,
    mariaTasks[17].id,
    maria.id,
    cycle1,
    'NEEDS_ATTENTION',
    'POOR',
    'EPDE_PROFESSIONAL',
    'INSPECTION_ONLY',
    undefined,
    'Humedad ascendente detectada en muro sur',
  );
  await createLog(
    prisma,
    mariaTasks[23].id,
    maria.id,
    cycle1,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[24].id,
    maria.id,
    cycle1,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[30].id,
    maria.id,
    cycle1,
    'OK',
    'GOOD',
    'HIRED_PROFESSIONAL',
    'INSPECTION_ONLY',
    8500,
    'Revisión completa tablero — todo en orden',
  );
  await createLog(
    prisma,
    mariaTasks[31].id,
    maria.id,
    cycle1,
    'OK',
    'EXCELLENT',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[35].id,
    maria.id,
    cycle1,
    'OK',
    'GOOD',
    'HIRED_PROFESSIONAL',
    'FULL_SERVICE',
    12000,
    'Revisión anual gasista matriculado',
  );
  await createLog(
    prisma,
    mariaTasks[36].id,
    maria.id,
    cycle1,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );

  // Ciclo 2 — Mar 2025 (control semestral)
  const cycle2 = monthsAgo(11);
  await createLog(
    prisma,
    mariaTasks[2].id,
    maria.id,
    cycle2,
    'NEEDS_ATTENTION',
    'FAIR',
    'EPDE_PROFESSIONAL',
    'INSPECTION_ONLY',
    undefined,
    'Grieta muro norte creció a 0.5mm — seguimiento semestral',
  );
  await createLog(prisma, mariaTasks[8].id, maria.id, cycle2, 'OK', 'GOOD', 'OWNER', 'CLEANING');
  await createLog(prisma, mariaTasks[9].id, maria.id, cycle2, 'OK', 'GOOD', 'OWNER', 'CLEANING');
  await createLog(
    prisma,
    mariaTasks[22].id,
    maria.id,
    cycle2,
    'OK_WITH_OBSERVATIONS',
    'FAIR',
    'OWNER',
    'INSPECTION_ONLY',
    undefined,
    'Algo de moho detrás del placard del dormitorio',
  );
  await createLog(
    prisma,
    mariaTasks[26].id,
    maria.id,
    cycle2,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[31].id,
    maria.id,
    cycle2,
    'OK',
    'EXCELLENT',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(prisma, mariaTasks[47].id, maria.id, cycle2, 'OK', 'GOOD', 'OWNER', 'CLEANING');

  // Ciclo 3 — Jul 2025 (control anual completo — segundo año)
  const cycle3 = monthsAgo(7);
  await createLog(
    prisma,
    mariaTasks[0].id,
    maria.id,
    cycle3,
    'OK_WITH_OBSERVATIONS',
    'FAIR',
    'EPDE_PROFESSIONAL',
    'INSPECTION_ONLY',
    undefined,
    'Microfisuras en viga estables — sin cambios respecto a control anterior',
  );
  await createLog(
    prisma,
    mariaTasks[1].id,
    maria.id,
    cycle3,
    'NEEDS_REPAIR',
    'POOR',
    'EPDE_PROFESSIONAL',
    'INSPECTION_ONLY',
    undefined,
    'Fisura muro norte alcanzó 0.8mm — se recomienda reparar',
  );
  await createLog(
    prisma,
    mariaTasks[3].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'HIRED_PROFESSIONAL',
    'INSPECTION_ONLY',
    15000,
    'Medición con nivel láser — sin asentamientos detectados',
  );
  await createLog(
    prisma,
    mariaTasks[4].id,
    maria.id,
    cycle3,
    'NOT_APPLICABLE',
    'GOOD',
    'EPDE_PROFESSIONAL',
    'NO_ACTION',
    undefined,
    'No se detectan armaduras expuestas',
  );
  await createLog(
    prisma,
    mariaTasks[5].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[6].id,
    maria.id,
    cycle3,
    'OK',
    'FAIR',
    'EPDE_PROFESSIONAL',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[10].id,
    maria.id,
    cycle3,
    'OK_WITH_OBSERVATIONS',
    'FAIR',
    'HIRED_PROFESSIONAL',
    'INSPECTION_ONLY',
    7500,
    'Membrana con desgaste normal, vida útil estimada 3 años más',
  );
  await createLog(
    prisma,
    mariaTasks[11].id,
    maria.id,
    cycle3,
    'OK',
    'FAIR',
    'HIRED_PROFESSIONAL',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[12].id,
    maria.id,
    cycle3,
    'NEEDS_REPAIR',
    'POOR',
    'OWNER',
    'INSPECTION_ONLY',
    undefined,
    'Sellador babeta chimenea agrietado — ingresa agua',
  );
  await createLog(
    prisma,
    mariaTasks[14].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'HIRED_PROFESSIONAL',
    'INSPECTION_ONLY',
    18000,
    'Sin presencia de xilófagos',
  );
  await createLog(
    prisma,
    mariaTasks[17].id,
    maria.id,
    cycle3,
    'NEEDS_REPAIR',
    'POOR',
    'EPDE_PROFESSIONAL',
    'INSPECTION_ONLY',
    undefined,
    'Humedad ascendente empeoró, pintura ampollada en base muro sur',
  );
  await createLog(
    prisma,
    mariaTasks[18].id,
    maria.id,
    cycle3,
    'OK_WITH_OBSERVATIONS',
    'FAIR',
    'OWNER',
    'INSPECTION_ONLY',
    undefined,
    'Algunas zonas de revoque hueco en medianera',
  );
  await createLog(
    prisma,
    mariaTasks[25].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'HIRED_PROFESSIONAL',
    'CLEANING',
    25000,
    'Limpieza profesional tanque 1000L',
  );
  await createLog(
    prisma,
    mariaTasks[27].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[30].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'HIRED_PROFESSIONAL',
    'INSPECTION_ONLY',
    10000,
  );
  await createLog(
    prisma,
    mariaTasks[33].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'HIRED_PROFESSIONAL',
    'ADJUSTMENT',
    6000,
    'Ajuste general borneras tablero principal',
  );
  await createLog(
    prisma,
    mariaTasks[34].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[35].id,
    maria.id,
    cycle3,
    'OK_WITH_OBSERVATIONS',
    'FAIR',
    'HIRED_PROFESSIONAL',
    'FULL_SERVICE',
    15000,
    'Calefón necesitará recambio de membrana pronto',
  );
  await createLog(
    prisma,
    mariaTasks[36].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(prisma, mariaTasks[38].id, maria.id, cycle3, 'OK', 'GOOD', 'OWNER', 'ADJUSTMENT');
  await createLog(
    prisma,
    mariaTasks[39].id,
    maria.id,
    cycle3,
    'NEEDS_ATTENTION',
    'FAIR',
    'OWNER',
    'INSPECTION_ONLY',
    undefined,
    'Burletes de ventanas del frente deteriorados',
  );
  await createLog(prisma, mariaTasks[41].id, maria.id, cycle3, 'OK', 'GOOD', 'OWNER', 'ADJUSTMENT');
  await createLog(
    prisma,
    mariaTasks[42].id,
    maria.id,
    cycle3,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[43].id,
    maria.id,
    cycle3,
    'OK_WITH_OBSERVATIONS',
    'FAIR',
    'OWNER',
    'INSPECTION_ONLY',
    undefined,
    'Un cerámico flojo en baño principal',
  );

  // Ciclo 4 — Sep 2025 (semestral)
  const cycle4 = monthsAgo(5);
  await createLog(
    prisma,
    mariaTasks[2].id,
    maria.id,
    cycle4,
    'NEEDS_REPAIR',
    'POOR',
    'EPDE_PROFESSIONAL',
    'INSPECTION_ONLY',
    undefined,
    'Grieta muro norte 1.2mm — crecimiento activo, derivar a ingeniero',
  );
  await createLog(prisma, mariaTasks[8].id, maria.id, cycle4, 'OK', 'GOOD', 'OWNER', 'CLEANING');
  await createLog(prisma, mariaTasks[9].id, maria.id, cycle4, 'OK', 'GOOD', 'OWNER', 'CLEANING');
  await createLog(
    prisma,
    mariaTasks[22].id,
    maria.id,
    cycle4,
    'OK',
    'GOOD',
    'OWNER',
    'CLEANING',
    undefined,
    'Se trató moho con lavandina y se mejoró ventilación',
  );
  await createLog(
    prisma,
    mariaTasks[26].id,
    maria.id,
    cycle4,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[31].id,
    maria.id,
    cycle4,
    'OK',
    'EXCELLENT',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(prisma, mariaTasks[47].id, maria.id, cycle4, 'OK', 'GOOD', 'OWNER', 'CLEANING');

  // Tareas ON_DETECTION completadas (hallazgos reales)
  await createLog(
    prisma,
    mariaTasks[21].id,
    maria.id,
    monthsAgo(10),
    'OK',
    'GOOD',
    'OWNER',
    'SEALING',
    2500,
    'Fisura sellada en revoque exterior fachada',
  );
  await createLog(
    prisma,
    mariaTasks[21].id,
    maria.id,
    monthsAgo(3),
    'OK',
    'GOOD',
    'OWNER',
    'SEALING',
    1800,
    'Nueva fisura sellada en medianera',
  );

  // —— Recent completions (within last 30 days for dashboard "Completadas" metric) ——
  await createLog(
    prisma,
    mariaTasks[0].id,
    maria.id,
    daysAgo(5),
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[3].id,
    maria.id,
    daysAgo(10),
    'OK',
    'FAIR',
    'OWNER',
    'CLEANING',
    2500,
  );
  await createLog(
    prisma,
    mariaTasks[8].id,
    maria.id,
    daysAgo(15),
    'OK',
    'GOOD',
    'HIRED_PROFESSIONAL',
    'ADJUSTMENT',
    8000,
  );
  await createLog(
    prisma,
    mariaTasks[12].id,
    maria.id,
    daysAgo(20),
    'OK_WITH_OBSERVATIONS',
    'FAIR',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    mariaTasks[18].id,
    maria.id,
    daysAgo(25),
    'OK',
    'GOOD',
    'OWNER',
    'CLEANING',
  );

  const mariaLogCount = 51;
  console.log(
    `  ✓ ${mariaLogCount} registros de historial (4 ciclos + 2 detecciones + 5 recientes)`,
  );

  // —— Presupuestos de María ——

  // Presupuesto 1: Reparación babeta chimenea (COMPLETED)
  const budget1 = await prisma.budgetRequest.create({
    data: {
      propertyId: mariaProp.id,
      requestedBy: maria.id,
      title: 'Reparación sellado babeta chimenea',
      description:
        'Se detectó ingreso de agua por babeta agrietada en la chimenea del techo. Requiere remoción de sellador viejo y aplicación nuevo.',
      status: 'COMPLETED',
      createdAt: monthsAgo(6),
      createdBy: maria.id,
    },
  });
  await prisma.budgetLineItem.createMany({
    data: [
      {
        budgetRequestId: budget1.id,
        description: 'Mano de obra — techista',
        quantity: new Prisma.Decimal(1),
        unitPrice: new Prisma.Decimal(35000),
        subtotal: new Prisma.Decimal(35000),
      },
      {
        budgetRequestId: budget1.id,
        description: 'Sellador poliuretánico x 300ml',
        quantity: new Prisma.Decimal(2),
        unitPrice: new Prisma.Decimal(8500),
        subtotal: new Prisma.Decimal(17000),
      },
      {
        budgetRequestId: budget1.id,
        description: 'Membrana autoadhesiva 1m',
        quantity: new Prisma.Decimal(3),
        unitPrice: new Prisma.Decimal(4200),
        subtotal: new Prisma.Decimal(12600),
      },
    ],
  });
  await prisma.budgetResponse.create({
    data: {
      budgetRequestId: budget1.id,
      totalAmount: new Prisma.Decimal(64600),
      estimatedDays: 2,
      notes: 'Incluye materiales y mano de obra. Garantía 2 años.',
      validUntil: monthsAgo(5),
      respondedAt: monthsAgo(6),
    },
  });

  // Presupuesto 2: Tratamiento humedad ascendente (IN_PROGRESS)
  const budget2 = await prisma.budgetRequest.create({
    data: {
      propertyId: mariaProp.id,
      requestedBy: maria.id,
      title: 'Tratamiento humedad ascendente muro sur',
      description:
        'Humedad ascendente persistente en muro sur, detectada en múltiples inspecciones. Requiere inyección hidrófuga.',
      status: 'IN_PROGRESS',
      createdAt: monthsAgo(3),
      createdBy: maria.id,
    },
  });
  await prisma.budgetLineItem.createMany({
    data: [
      {
        budgetRequestId: budget2.id,
        description: 'Inyección hidrófuga — 8ml perforación',
        quantity: new Prisma.Decimal(15),
        unitPrice: new Prisma.Decimal(12000),
        subtotal: new Prisma.Decimal(180000),
      },
      {
        budgetRequestId: budget2.id,
        description: 'Revoque hidrófugo reparación',
        quantity: new Prisma.Decimal(6),
        unitPrice: new Prisma.Decimal(18000),
        subtotal: new Prisma.Decimal(108000),
      },
      {
        budgetRequestId: budget2.id,
        description: 'Pintura antihumedad impermeabilizante',
        quantity: new Prisma.Decimal(2),
        unitPrice: new Prisma.Decimal(22000),
        subtotal: new Prisma.Decimal(44000),
      },
    ],
  });
  await prisma.budgetResponse.create({
    data: {
      budgetRequestId: budget2.id,
      totalAmount: new Prisma.Decimal(332000),
      estimatedDays: 5,
      notes: 'Trabajo de 5 días hábiles. Se recomienda ejecutar en época seca. Garantía 5 años.',
      validUntil: monthsFromNow(1),
      respondedAt: monthsAgo(2),
    },
  });
  // —— Audit logs, comentarios y adjuntos de presupuestos de María ——

  // Budget 1 (COMPLETED): full lifecycle audit trail
  await prisma.budgetAuditLog.createMany({
    data: [
      {
        budgetId: budget1.id,
        userId: maria.id,
        action: 'created',
        before: {},
        after: { status: 'PENDING', title: budget1.title },
        changedAt: monthsAgo(6),
      },
      {
        budgetId: budget1.id,
        userId: admin.id,
        action: 'quoted',
        before: { status: 'PENDING' },
        after: { status: 'QUOTED', totalAmount: 64600 },
        changedAt: monthsAgo(6),
      },
      {
        budgetId: budget1.id,
        userId: maria.id,
        action: 'approved',
        before: { status: 'QUOTED' },
        after: { status: 'APPROVED' },
        changedAt: monthsAgo(5),
      },
      {
        budgetId: budget1.id,
        userId: admin.id,
        action: 'in-progress',
        before: { status: 'APPROVED' },
        after: { status: 'IN_PROGRESS' },
        changedAt: monthsAgo(5),
      },
      {
        budgetId: budget1.id,
        userId: admin.id,
        action: 'completed',
        before: { status: 'IN_PROGRESS' },
        after: { status: 'COMPLETED' },
        changedAt: monthsAgo(4),
      },
    ],
  });
  await prisma.budgetComment.createMany({
    data: [
      {
        budgetId: budget1.id,
        userId: maria.id,
        content: '¿Pueden pasar un sábado? De lunes a viernes trabajo.',
        createdAt: monthsAgo(6),
      },
      {
        budgetId: budget1.id,
        userId: admin.id,
        content: 'Sí, podemos coordinar para el sábado siguiente a la aprobación.',
        createdAt: monthsAgo(6),
      },
      {
        budgetId: budget1.id,
        userId: admin.id,
        content: 'Trabajo finalizado. Sellado completo, garantía 2 años.',
        createdAt: monthsAgo(4),
      },
    ],
  });
  await prisma.budgetAttachment.createMany({
    data: [
      {
        budgetId: budget1.id,
        url: 'https://storage.example.com/babeta-antes.jpg',
        fileName: 'babeta-antes.jpg',
        createdAt: monthsAgo(6),
      },
      {
        budgetId: budget1.id,
        url: 'https://storage.example.com/babeta-despues.jpg',
        fileName: 'babeta-despues.jpg',
        createdAt: monthsAgo(4),
      },
    ],
  });

  // Budget 2 (IN_PROGRESS): partial lifecycle
  await prisma.budgetAuditLog.createMany({
    data: [
      {
        budgetId: budget2.id,
        userId: maria.id,
        action: 'created',
        before: {},
        after: { status: 'PENDING', title: budget2.title },
        changedAt: monthsAgo(3),
      },
      {
        budgetId: budget2.id,
        userId: admin.id,
        action: 'quoted',
        before: { status: 'PENDING' },
        after: { status: 'QUOTED', totalAmount: 332000 },
        changedAt: monthsAgo(2),
      },
      {
        budgetId: budget2.id,
        userId: maria.id,
        action: 'approved',
        before: { status: 'QUOTED' },
        after: { status: 'APPROVED' },
        changedAt: monthsAgo(2),
      },
      {
        budgetId: budget2.id,
        userId: admin.id,
        action: 'in-progress',
        before: { status: 'APPROVED' },
        after: { status: 'IN_PROGRESS' },
        changedAt: monthsAgo(1),
      },
    ],
  });
  await prisma.budgetComment.createMany({
    data: [
      {
        budgetId: budget2.id,
        userId: maria.id,
        content: 'La humedad en el muro sur empeoró con las últimas lluvias. Adjunto foto.',
        createdAt: monthsAgo(3),
      },
      {
        budgetId: budget2.id,
        userId: admin.id,
        content:
          'Entendido, recomendamos inyección hidrófuga con resina poliuretánica. Enviamos cotización.',
        createdAt: monthsAgo(2),
      },
    ],
  });
  await prisma.budgetAttachment.createMany({
    data: [
      {
        budgetId: budget2.id,
        url: 'https://storage.example.com/humedad-muro-sur.jpg',
        fileName: 'humedad-muro-sur.jpg',
        createdAt: monthsAgo(3),
      },
      {
        budgetId: budget2.id,
        url: 'https://storage.example.com/informe-humedad.pdf',
        fileName: 'informe-humedad-diagnostico.pdf',
        createdAt: monthsAgo(2),
      },
    ],
  });

  console.log('  ✓ 2 presupuestos (1 completado, 1 en progreso)');
  console.log('  ✓ 9 audit logs + 5 comentarios + 4 adjuntos en presupuestos');

  // —— Solicitud de servicio de María ——
  const service1 = await prisma.serviceRequest.create({
    data: {
      propertyId: mariaProp.id,
      requestedBy: maria.id,
      title: 'Evaluación estructural grieta activa',
      description:
        'Grieta en muro norte creció de 0.3mm a 1.2mm en 12 meses. Necesito evaluación de ingeniero estructural para determinar causa y acción correctiva.',
      urgency: 'HIGH',
      status: 'IN_PROGRESS',
      assignedToName: 'Ing. Juan Martínez — Estructural',
      firstResponseAt: monthsAgo(3),
      createdAt: monthsAgo(4),
      createdBy: maria.id,
    },
  });
  console.log('  ✓ 1 solicitud de servicio (evaluación estructural en progreso, asignada)');

  // —— Audit logs, comentarios y adjuntos de la solicitud de María ——
  await prisma.serviceRequestAuditLog.createMany({
    data: [
      {
        serviceRequestId: service1.id,
        userId: maria.id,
        action: 'created',
        before: {},
        after: { title: service1.title, urgency: 'HIGH', photoCount: 0 },
        changedAt: monthsAgo(4),
      },
      {
        serviceRequestId: service1.id,
        userId: admin.id,
        action: 'in-review',
        before: { status: 'OPEN' },
        after: { status: 'IN_REVIEW', note: 'Derivamos al ingeniero estructural de confianza' },
        changedAt: monthsAgo(3.5),
      },
      {
        serviceRequestId: service1.id,
        userId: admin.id,
        action: 'in-progress',
        before: { status: 'IN_REVIEW' },
        after: { status: 'IN_PROGRESS', note: 'El ing. Martínez confirmó la visita para el lunes' },
        changedAt: monthsAgo(3),
      },
    ],
  });
  await prisma.serviceRequestComment.createMany({
    data: [
      {
        serviceRequestId: service1.id,
        userId: maria.id,
        content:
          'La grieta parece estar creciendo más rápido en los últimos meses, sobre todo después de las lluvias.',
        createdAt: monthsAgo(4),
      },
      {
        serviceRequestId: service1.id,
        userId: admin.id,
        content: 'María, agendamos la visita del Ing. Martínez. Te avisamos cuando confirme fecha.',
        createdAt: monthsAgo(3.5),
      },
      {
        serviceRequestId: service1.id,
        userId: maria.id,
        content: 'Perfecto, estoy disponible cualquier día de la semana por la mañana.',
        createdAt: monthsAgo(3.2),
      },
    ],
  });
  await prisma.serviceRequestAttachment.createMany({
    data: [
      {
        serviceRequestId: service1.id,
        url: 'https://example.com/docs/informe-preliminar-grieta.pdf',
        fileName: 'Informe preliminar — grieta muro norte.pdf',
        createdAt: monthsAgo(3),
      },
      {
        serviceRequestId: service1.id,
        url: 'https://example.com/docs/presupuesto-reparacion-estructural.pdf',
        fileName: 'Presupuesto reparación estructural.pdf',
        createdAt: monthsAgo(2.5),
      },
    ],
  });
  console.log('  ✓ 3 audit logs + 3 comentarios + 2 adjuntos en solicitud de servicio');

  // —— Notificaciones de María ——
  await prisma.notification.createMany({
    data: [
      {
        userId: maria.id,
        type: 'TASK_REMINDER',
        title: 'Tareas vencidas',
        message: 'Tenés 4 tareas vencidas en tu plan de mantenimiento.',
        read: false,
        createdAt: daysAgo(5),
      },
      {
        userId: maria.id,
        type: 'BUDGET_UPDATE',
        title: 'Presupuesto en progreso',
        message: 'El tratamiento de humedad ascendente comenzó.',
        read: true,
        createdAt: monthsAgo(1),
        data: { budgetRequestId: budget2.id } as never,
      },
      {
        userId: maria.id,
        type: 'SERVICE_UPDATE',
        title: 'Servicio actualizado',
        message: 'Tu solicitud de evaluación estructural pasó a "En progreso".',
        read: true,
        createdAt: monthsAgo(3),
        data: { serviceRequestId: service1.id } as never,
      },
      {
        userId: maria.id,
        type: 'TASK_REMINDER',
        title: 'Limpieza de canaletas',
        message: 'La limpieza semestral de canaletas está próxima.',
        read: false,
        createdAt: daysAgo(10),
      },
    ],
  });
  console.log('  ✓ 4 notificaciones (2 no leídas)');

  // ————————————————————————————————————————————————————————————————————————
  // USUARIO 2: CARLOS RODRÍGUEZ — Intermedio (6 meses)
  // Casa moderna 2015, problemas menores, uso regular pero no completo
  // ————————————————————————————————————————————————————————————————————————

  console.log('\n👤 Carlos Rodríguez — Intermedio (6 meses de uso)');

  const carlos = await prisma.user.create({
    data: {
      id: ids.carlos,
      email: 'carlos.rodriguez@demo.com',
      name: 'Carlos Rodríguez',
      phone: '+54 11 6789-4321',
      passwordHash,
      role: 'CLIENT',
      status: 'ACTIVE',
      createdAt: monthsAgo(6),
      lastLoginAt: daysAgo(8),
      activatedAt: monthsAgo(6),
      subscriptionExpiresAt: daysAgo(-90),
    },
  });

  const carlosProp = await prisma.property.create({
    data: {
      id: ids.carlosProp,
      userId: carlos.id,
      address: 'Los Robles 892',
      city: 'Pilar',
      type: 'HOUSE',
      yearBuilt: 2015,
      squareMeters: 180,
      createdAt: monthsAgo(6),
      createdBy: admin.id,
    },
  });

  const carlosInspection = await prisma.inspectionChecklist.create({
    data: {
      id: ids.carlosInspection,
      propertyId: carlosProp.id,
      inspectedBy: admin.id,
      inspectedAt: monthsAgo(6),
      notes: 'Casa moderna 2015. Buen estado general, priorizar seguridad en gas y eléctrica.',
      items: {
        create: [
          { sector: 'EXTERIOR', name: 'Fachada y pintura', status: 'OK', order: 0 },
          { sector: 'ROOF', name: 'Cubierta y canaletas', status: 'OK', order: 1 },
          {
            sector: 'INSTALLATIONS',
            name: 'Tablero eléctrico',
            status: 'NEEDS_ATTENTION',
            finding: 'Etiquetado incompleto de circuitos',
            order: 2,
          },
          {
            sector: 'INSTALLATIONS',
            name: 'Instalación de gas',
            status: 'NEEDS_ATTENTION',
            finding: 'Flexible de cocina próximo a vencer',
            order: 3,
          },
          { sector: 'GARDEN', name: 'Jardín y exteriores', status: 'OK', order: 4 },
        ],
      },
    },
  });

  const carlosPlan = await prisma.maintenancePlan.create({
    data: {
      id: ids.carlosPlan,
      propertyId: carlosProp.id,
      name: 'Plan de Mantenimiento Preventivo',
      status: 'ACTIVE',
      sourceInspectionId: carlosInspection.id,
      createdAt: monthsAgo(6),
      createdBy: admin.id,
    },
  });

  // Tareas para Carlos — casa nueva, mayoría PENDING, algunas UPCOMING
  const carlosTasks = await createTasksForPlan(
    prisma,
    carlosPlan.id,
    categoryIds,
    (def, i) => {
      if (def.recurrenceType === 'ON_DETECTION') return { nextDueDate: null, status: 'PENDING' };
      if (def.recurrenceType === 'BIANNUAL')
        return { nextDueDate: daysAgo(-5 - (i % 10)), status: 'UPCOMING' };
      if (def.recurrenceType === 'ANNUAL')
        return { nextDueDate: monthsFromNow(6), status: 'PENDING' };
      return { nextDueDate: monthsFromNow(def.recurrenceMonths), status: 'PENDING' };
    },
    monthsAgo(6),
  );
  console.log(`  ✓ Propiedad: ${carlosProp.address} (${carlosProp.city}) — 71 tareas`);

  // —— Task Logs para Carlos (1 ciclo parcial) ——
  const carlosCycle1 = monthsAgo(3);
  await createLog(
    prisma,
    carlosTasks[30].id,
    carlos.id,
    carlosCycle1,
    'OK',
    'EXCELLENT',
    'HIRED_PROFESSIONAL',
    'INSPECTION_ONLY',
    9000,
    'Tablero en perfecto estado, casa reciente',
  );
  await createLog(
    prisma,
    carlosTasks[31].id,
    carlos.id,
    carlosCycle1,
    'OK',
    'EXCELLENT',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    carlosTasks[34].id,
    carlos.id,
    carlosCycle1,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    carlosTasks[35].id,
    carlos.id,
    carlosCycle1,
    'OK',
    'EXCELLENT',
    'HIRED_PROFESSIONAL',
    'FULL_SERVICE',
    14000,
    'Revisión anual completa — artefactos impecables',
  );
  await createLog(
    prisma,
    carlosTasks[36].id,
    carlos.id,
    carlosCycle1,
    'OK',
    'EXCELLENT',
    'OWNER',
    'INSPECTION_ONLY',
  );

  const carlosCycle1b = monthsAgo(2);
  await createLog(
    prisma,
    carlosTasks[8].id,
    carlos.id,
    carlosCycle1b,
    'OK',
    'GOOD',
    'OWNER',
    'CLEANING',
  );
  await createLog(
    prisma,
    carlosTasks[9].id,
    carlos.id,
    carlosCycle1b,
    'OK',
    'GOOD',
    'OWNER',
    'CLEANING',
  );
  await createLog(
    prisma,
    carlosTasks[26].id,
    carlos.id,
    carlosCycle1b,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    carlosTasks[47].id,
    carlos.id,
    carlosCycle1b,
    'OK',
    'GOOD',
    'OWNER',
    'CLEANING',
  );

  const carlosCycle1c = monthsAgo(1);
  await createLog(
    prisma,
    carlosTasks[23].id,
    carlos.id,
    carlosCycle1c,
    'OK',
    'EXCELLENT',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    carlosTasks[24].id,
    carlos.id,
    carlosCycle1c,
    'OK',
    'EXCELLENT',
    'OWNER',
    'INSPECTION_ONLY',
  );
  await createLog(
    prisma,
    carlosTasks[25].id,
    carlos.id,
    carlosCycle1c,
    'OK',
    'GOOD',
    'HIRED_PROFESSIONAL',
    'CLEANING',
    20000,
    'Limpieza y desinfección tanque',
  );
  await createLog(
    prisma,
    carlosTasks[38].id,
    carlos.id,
    carlosCycle1c,
    'OK',
    'GOOD',
    'OWNER',
    'ADJUSTMENT',
  );
  await createLog(
    prisma,
    carlosTasks[39].id,
    carlos.id,
    carlosCycle1c,
    'OK',
    'GOOD',
    'OWNER',
    'INSPECTION_ONLY',
    undefined,
    'Burletes en buen estado, casa de 10 años',
  );

  console.log('  ✓ 14 registros de historial (3 meses de actividad parcial)');

  // —— Presupuesto de Carlos ——
  const budget3 = await prisma.budgetRequest.create({
    data: {
      propertyId: carlosProp.id,
      requestedBy: carlos.id,
      title: 'Verificación de puesta a tierra',
      description:
        'La tarea de verificación de puesta a tierra requiere profesional matriculado con telurímetro. Solicito presupuesto.',
      status: 'QUOTED',
      createdAt: monthsAgo(1),
      createdBy: carlos.id,
    },
  });
  await prisma.budgetLineItem.createMany({
    data: [
      {
        budgetRequestId: budget3.id,
        description: 'Medición con telurímetro certificado',
        quantity: new Prisma.Decimal(1),
        unitPrice: new Prisma.Decimal(18000),
        subtotal: new Prisma.Decimal(18000),
      },
      {
        budgetRequestId: budget3.id,
        description: 'Informe técnico con valores y recomendaciones',
        quantity: new Prisma.Decimal(1),
        unitPrice: new Prisma.Decimal(5000),
        subtotal: new Prisma.Decimal(5000),
      },
    ],
  });
  await prisma.budgetResponse.create({
    data: {
      budgetRequestId: budget3.id,
      totalAmount: new Prisma.Decimal(23000),
      estimatedDays: 1,
      notes: 'Visita de medio día. Incluye informe técnico firmado.',
      validUntil: monthsFromNow(1),
      respondedAt: daysAgo(20),
    },
  });
  // —— Audit logs y comentarios del presupuesto de Carlos ——
  await prisma.budgetAuditLog.createMany({
    data: [
      {
        budgetId: budget3.id,
        userId: carlos.id,
        action: 'created',
        before: {},
        after: { status: 'PENDING', title: budget3.title },
        changedAt: monthsAgo(1),
      },
      {
        budgetId: budget3.id,
        userId: admin.id,
        action: 'quoted',
        before: { status: 'PENDING' },
        after: { status: 'QUOTED', totalAmount: 23000 },
        changedAt: daysAgo(20),
      },
    ],
  });
  await prisma.budgetComment.create({
    data: {
      budgetId: budget3.id,
      userId: carlos.id,
      content:
        'El disyuntor diferencial salta a veces, quiero verificar si la puesta a tierra está bien.',
      createdAt: monthsAgo(1),
    },
  });

  console.log('  ✓ 1 presupuesto (cotizado, pendiente de aprobación)');
  console.log('  ✓ 2 audit logs + 1 comentario en presupuesto');

  // —— Solicitud de servicio de Carlos (OPEN — editable) ——
  const service2 = await prisma.serviceRequest.create({
    data: {
      propertyId: carlosProp.id,
      requestedBy: carlos.id,
      title: 'Revisión de disyuntor diferencial',
      description:
        'El disyuntor diferencial de la cocina salta ocasionalmente sin causa aparente. Necesito que un electricista revise el circuito completo.',
      urgency: 'MEDIUM',
      status: 'OPEN',
      createdAt: daysAgo(3),
      createdBy: carlos.id,
    },
  });
  await prisma.serviceRequestAuditLog.create({
    data: {
      serviceRequestId: service2.id,
      userId: carlos.id,
      action: 'created',
      before: {},
      after: { title: service2.title, urgency: 'MEDIUM', photoCount: 0 },
      changedAt: daysAgo(3),
    },
  });
  await prisma.serviceRequestComment.create({
    data: {
      serviceRequestId: service2.id,
      userId: carlos.id,
      content: 'Pasa sobre todo cuando prendo el horno eléctrico y el microondas al mismo tiempo.',
      createdAt: daysAgo(3),
    },
  });
  console.log('  ✓ 1 solicitud de servicio (OPEN, editable)');
  console.log('  ✓ 1 audit log + 1 comentario en solicitud');

  // —— Notificaciones de Carlos ——
  await prisma.notification.createMany({
    data: [
      {
        userId: carlos.id,
        type: 'BUDGET_UPDATE',
        title: 'Presupuesto cotizado',
        message: 'Tu presupuesto de verificación de puesta a tierra fue cotizado.',
        read: true,
        createdAt: daysAgo(20),
        data: { budgetRequestId: budget3.id } as never,
      },
      {
        userId: carlos.id,
        type: 'TASK_REMINDER',
        title: 'Tareas semestrales próximas',
        message: 'Tenés 7 tareas semestrales próximas a vencer.',
        read: false,
        createdAt: daysAgo(7),
      },
    ],
  });
  console.log('  ✓ 2 notificaciones');

  // ————————————————————————————————————————————————————————————————————————
  // USUARIO 3: LAURA FERNÁNDEZ — Nueva (1 mes)
  // Casa recién construida 2023, todo flamante, plan recién creado
  // ————————————————————————————————————————————————————————————————————————

  console.log('\n👤 Laura Fernández — Nueva (1 mes de uso)');

  const laura = await prisma.user.create({
    data: {
      id: ids.laura,
      email: 'laura.fernandez@demo.com',
      name: 'Laura Fernández',
      phone: '+54 341 555-8765',
      passwordHash,
      role: 'CLIENT',
      status: 'ACTIVE',
      createdAt: monthsAgo(1),
      lastLoginAt: daysAgo(1),
      activatedAt: monthsAgo(1),
      subscriptionExpiresAt: daysAgo(-150),
    },
  });

  const lauraProp = await prisma.property.create({
    data: {
      id: ids.lauraProp,
      userId: laura.id,
      address: 'Barrio Los Álamos, Manzana 12, Lote 7',
      city: 'Funes',
      type: 'HOUSE',
      yearBuilt: 2023,
      squareMeters: 150,
      createdAt: monthsAgo(1),
      createdBy: admin.id,
    },
  });

  const lauraInspection = await prisma.inspectionChecklist.create({
    data: {
      id: ids.lauraInspection,
      propertyId: lauraProp.id,
      inspectedBy: admin.id,
      inspectedAt: monthsAgo(1),
      notes: 'Casa nueva 2023. Excelente estado general, plan preventivo de rutina.',
      items: {
        create: [
          { sector: 'EXTERIOR', name: 'Fachada y pintura', status: 'OK', order: 0 },
          { sector: 'ROOF', name: 'Cubierta', status: 'OK', order: 1 },
          { sector: 'INSTALLATIONS', name: 'Instalaciones', status: 'OK', order: 2 },
          { sector: 'INTERIOR', name: 'Interior general', status: 'OK', order: 3 },
        ],
      },
    },
  });

  const lauraPlan = await prisma.maintenancePlan.create({
    data: {
      id: ids.lauraPlan,
      propertyId: lauraProp.id,
      name: 'Plan de Mantenimiento Preventivo',
      status: 'ACTIVE',
      sourceInspectionId: lauraInspection.id,
      createdAt: monthsAgo(1),
      createdBy: admin.id,
    },
  });

  // Tareas para Laura — todo PENDING, fechas futuras
  await createTasksForPlan(
    prisma,
    lauraPlan.id,
    categoryIds,
    (def) => {
      if (def.recurrenceType === 'ON_DETECTION') return { nextDueDate: null, status: 'PENDING' };
      return { nextDueDate: monthsFromNow((def.recurrenceMonths || 12) - 1), status: 'PENDING' };
    },
    monthsAgo(1),
  );
  console.log(
    `  ✓ Propiedad: ${lauraProp.address} (${lauraProp.city}) — 71 tareas (todas pendientes)`,
  );
  console.log('  ✓ Sin historial, presupuestos ni solicitudes');

  // —— Notificación de bienvenida ——
  await prisma.notification.create({
    data: {
      userId: laura.id,
      type: 'SYSTEM',
      title: 'Bienvenida a EPDE',
      message:
        'Tu plan de mantenimiento preventivo fue creado con 71 tareas. Revisá las tareas próximas en tu panel.',
      read: true,
      createdAt: monthsAgo(1),
    },
  });
  console.log('  ✓ 1 notificación de bienvenida');

  // ————————————————————————————————————————————————————————————————————————
  // PLANTILLAS DE COTIZACIÓN
  // ————————————————————————————————————————————————————————————————————————

  await prisma.quoteTemplate.create({
    data: {
      name: 'Reparación de techo',
      createdBy: admin.id,
      items: {
        create: [
          {
            description: 'Mano de obra — techista',
            quantity: 1,
            unitPrice: 35000,
            displayOrder: 0,
          },
          {
            description: 'Sellador poliuretánico x 300ml',
            quantity: 2,
            unitPrice: 8500,
            displayOrder: 1,
          },
          {
            description: 'Membrana autoadhesiva 1m',
            quantity: 3,
            unitPrice: 4200,
            displayOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.quoteTemplate.create({
    data: {
      name: 'Mantenimiento eléctrico general',
      createdBy: admin.id,
      items: {
        create: [
          {
            description: 'Inspección de tablero eléctrico',
            quantity: 1,
            unitPrice: 15000,
            displayOrder: 0,
          },
          {
            description: 'Ajuste de conexiones y terminales',
            quantity: 1,
            unitPrice: 12000,
            displayOrder: 1,
          },
          {
            description: 'Prueba de disyuntores y térmica',
            quantity: 1,
            unitPrice: 8000,
            displayOrder: 2,
          },
          { description: 'Informe técnico', quantity: 1, unitPrice: 5000, displayOrder: 3 },
        ],
      },
    },
  });

  await prisma.quoteTemplate.create({
    data: {
      name: 'Tratamiento de humedad',
      createdBy: admin.id,
      items: {
        create: [
          {
            description: 'Inyección de barrera química (por metro)',
            quantity: 5,
            unitPrice: 18000,
            displayOrder: 0,
          },
          { description: 'Revoque hidrófugo', quantity: 8, unitPrice: 6500, displayOrder: 1 },
          {
            description: 'Pintura antihumedad (2 manos)',
            quantity: 8,
            unitPrice: 3200,
            displayOrder: 2,
          },
        ],
      },
    },
  });

  console.log('  ✓ 3 plantillas de cotización');

  // ════════════════════════════════════════════════════════════════════════
  // ISV SNAPSHOTS — Monthly health index history per property
  // ════════════════════════════════════════════════════════════════════════

  // María: 12 monthly snapshots — started strong, declined as issues accumulated
  // (overdue tasks, humidity detection, structural crack monitoring)
  const mariaISVSnapshots = [
    {
      month: 16,
      score: 78,
      label: 'Bueno',
      compliance: 90,
      condition: 80,
      coverage: 70,
      investment: 65,
      trend: 50,
    },
    {
      month: 15,
      score: 76,
      label: 'Bueno',
      compliance: 88,
      condition: 78,
      coverage: 72,
      investment: 60,
      trend: 48,
    },
    {
      month: 14,
      score: 74,
      label: 'Bueno',
      compliance: 85,
      condition: 75,
      coverage: 68,
      investment: 62,
      trend: 46,
    },
    {
      month: 13,
      score: 72,
      label: 'Bueno',
      compliance: 82,
      condition: 72,
      coverage: 65,
      investment: 60,
      trend: 45,
    },
    {
      month: 12,
      score: 70,
      label: 'Bueno',
      compliance: 80,
      condition: 70,
      coverage: 62,
      investment: 58,
      trend: 44,
    },
    {
      month: 11,
      score: 68,
      label: 'Bueno',
      compliance: 75,
      condition: 68,
      coverage: 60,
      investment: 55,
      trend: 42,
    },
    {
      month: 10,
      score: 65,
      label: 'Bueno',
      compliance: 72,
      condition: 65,
      coverage: 58,
      investment: 52,
      trend: 40,
    },
    {
      month: 9,
      score: 63,
      label: 'Bueno',
      compliance: 68,
      condition: 62,
      coverage: 55,
      investment: 55,
      trend: 42,
    },
    {
      month: 8,
      score: 62,
      label: 'Bueno',
      compliance: 66,
      condition: 60,
      coverage: 56,
      investment: 58,
      trend: 44,
    },
    {
      month: 7,
      score: 60,
      label: 'Bueno',
      compliance: 64,
      condition: 58,
      coverage: 54,
      investment: 56,
      trend: 42,
    },
    {
      month: 6,
      score: 58,
      label: 'Regular',
      compliance: 60,
      condition: 55,
      coverage: 52,
      investment: 55,
      trend: 40,
    },
    {
      month: 5,
      score: 56,
      label: 'Regular',
      compliance: 58,
      condition: 52,
      coverage: 50,
      investment: 54,
      trend: 38,
    },
  ];

  // Carlos: 5 monthly snapshots — stable, good modern house maintenance
  const carlosISVSnapshots = [
    {
      month: 5,
      score: 68,
      label: 'Bueno',
      compliance: 75,
      condition: 72,
      coverage: 45,
      investment: 70,
      trend: 50,
    },
    {
      month: 4,
      score: 70,
      label: 'Bueno',
      compliance: 78,
      condition: 74,
      coverage: 48,
      investment: 68,
      trend: 52,
    },
    {
      month: 3,
      score: 69,
      label: 'Bueno',
      compliance: 76,
      condition: 72,
      coverage: 50,
      investment: 65,
      trend: 50,
    },
    {
      month: 2,
      score: 71,
      label: 'Bueno',
      compliance: 80,
      condition: 74,
      coverage: 52,
      investment: 62,
      trend: 54,
    },
    {
      month: 1,
      score: 72,
      label: 'Bueno',
      compliance: 82,
      condition: 75,
      coverage: 55,
      investment: 60,
      trend: 56,
    },
  ];

  // Laura: 1 snapshot — new house, baseline high score
  const lauraISVSnapshots = [
    {
      month: 1,
      score: 85,
      label: 'Excelente',
      compliance: 100,
      condition: 80,
      coverage: 0,
      investment: 50,
      trend: 50,
    },
  ];

  // Sector scores coherent with each property's task distribution
  const mariaSectorScores = [
    { sector: 'INTERIOR', score: 55, overdue: 4, total: 12 },
    { sector: 'ROOF', score: 60, overdue: 2, total: 5 },
    { sector: 'EXTERIOR', score: 50, overdue: 5, total: 10 },
    { sector: 'BATHROOM', score: 65, overdue: 2, total: 6 },
    { sector: 'INSTALLATIONS', score: 58, overdue: 5, total: 14 },
    { sector: 'GARDEN', score: 62, overdue: 2, total: 6 },
    { sector: 'BASEMENT', score: 40, overdue: 3, total: 4 },
    { sector: 'TERRACE', score: 70, overdue: 1, total: 3 },
    { sector: 'KITCHEN', score: 75, overdue: 0, total: 2 },
  ];
  const carlosSectorScores = [
    { sector: 'INTERIOR', score: 80, overdue: 1, total: 12 },
    { sector: 'ROOF', score: 85, overdue: 0, total: 5 },
    { sector: 'EXTERIOR', score: 70, overdue: 2, total: 10 },
    { sector: 'BATHROOM', score: 75, overdue: 1, total: 6 },
    { sector: 'INSTALLATIONS', score: 72, overdue: 3, total: 14 },
    { sector: 'GARDEN', score: 80, overdue: 0, total: 6 },
    { sector: 'BASEMENT', score: 85, overdue: 0, total: 4 },
    { sector: 'TERRACE', score: 90, overdue: 0, total: 3 },
    { sector: 'KITCHEN', score: 90, overdue: 0, total: 2 },
  ];
  const lauraSectorScores = [
    { sector: 'INTERIOR', score: 100, overdue: 0, total: 12 },
    { sector: 'ROOF', score: 100, overdue: 0, total: 5 },
    { sector: 'EXTERIOR', score: 100, overdue: 0, total: 10 },
    { sector: 'BATHROOM', score: 100, overdue: 0, total: 6 },
    { sector: 'INSTALLATIONS', score: 100, overdue: 0, total: 14 },
    { sector: 'GARDEN', score: 100, overdue: 0, total: 6 },
    { sector: 'BASEMENT', score: 100, overdue: 0, total: 4 },
    { sector: 'TERRACE', score: 100, overdue: 0, total: 3 },
    { sector: 'KITCHEN', score: 100, overdue: 0, total: 2 },
  ];

  const allSnapshotData: Prisma.ISVSnapshotCreateManyInput[] = [
    ...mariaISVSnapshots.map((s) => ({
      propertyId: ids.mariaProp,
      snapshotDate: monthsAgo(s.month),
      score: s.score,
      label: s.label,
      compliance: s.compliance,
      condition: s.condition,
      coverage: s.coverage,
      investment: s.investment,
      trend: s.trend,
      sectorScores: mariaSectorScores as unknown as Prisma.InputJsonValue,
    })),
    ...carlosISVSnapshots.map((s) => ({
      propertyId: ids.carlosProp,
      snapshotDate: monthsAgo(s.month),
      score: s.score,
      label: s.label,
      compliance: s.compliance,
      condition: s.condition,
      coverage: s.coverage,
      investment: s.investment,
      trend: s.trend,
      sectorScores: carlosSectorScores as unknown as Prisma.InputJsonValue,
    })),
    ...lauraISVSnapshots.map((s) => ({
      propertyId: ids.lauraProp,
      snapshotDate: monthsAgo(s.month),
      score: s.score,
      label: s.label,
      compliance: s.compliance,
      condition: s.condition,
      coverage: s.coverage,
      investment: s.investment,
      trend: s.trend,
      sectorScores: lauraSectorScores as unknown as Prisma.InputJsonValue,
    })),
  ];

  await prisma.iSVSnapshot.createMany({ data: allSnapshotData });

  console.log(
    `  ✓ ${allSnapshotData.length} ISV snapshots (María: ${mariaISVSnapshots.length}, Carlos: ${carlosISVSnapshots.length}, Laura: ${lauraISVSnapshots.length})`,
  );

  // ————————————————————————————————————————————————————————————————————————
  // RESUMEN
  // ————————————————————————————————————————————————————————————————————————

  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN SEED DEMO');
  console.log('═'.repeat(60));
  console.log(`
  Usuarios:     4 (1 admin + 3 clientes)
  Propiedades:  3
  Planes:       3 (todos ACTIVE)
  Categorías:   ${CATEGORIES.length} (compartidas)
  Tareas:       ${3 * TASK_DEFS.length} (${TASK_DEFS.length} × 3 propiedades)
  Task Logs:    ${mariaLogCount + 14} (María: ${mariaLogCount} (incl. 5 últimos 30 días), Carlos: 14, Laura: 0)
  Presupuestos: 3 (COMPLETED, IN_PROGRESS, QUOTED)
  Audit Logs:   11 (5 + 4 + 2 presup.)
  Comentarios:  6 (3 + 2 + 1 presup.)
  Adjuntos:     4 (2 + 2 presup.)
  Servicios:    2 (IN_PROGRESS con SLA tracking, OPEN)
  SR Audit Logs: 4 (3 + 1)
  SR Comentarios: 4 (3 + 1)
  SR Adjuntos:  2
  Quote Tmpl:   3 (techo, eléctrico, humedad)
  Sectores:     9 (asignados via CATEGORY_DEFAULT_SECTOR + overrides puntuales)
  ISV Snaps:    ${allSnapshotData.length} (María: ${mariaISVSnapshots.length}, Carlos: ${carlosISVSnapshots.length}, Laura: ${lauraISVSnapshots.length})
  Notific.:     7

  👤 María González  (maria.gonzalez@demo.com / Demo123!)
     Casa 1985, 18 meses de uso, historial rico, problemas reales
     → Grieta activa monitoreada, humedad ascendente en tratamiento
     → 4 ciclos completos de mantenimiento
     → ISV: 78→56 (12 snapshots, tendencia declinante)

  👤 Carlos Rodríguez (carlos.rodriguez@demo.com / Demo123!)
     Casa 2015, 6 meses de uso, control parcial
     → Priorizó seguridad (gas + eléctrica), resto pendiente
     → Presupuesto de puesta a tierra cotizado
     → ISV: 68→72 (5 snapshots, tendencia estable/mejorando)

  👤 Laura Fernández  (laura.fernandez@demo.com / Demo123!)
     Casa 2023, 1 mes de uso, plan recién creado
     → Todas las tareas pendientes, sin historial
     → Caso de onboarding limpio
     → ISV: 85 (1 snapshot, baseline alto)
  `);
}
