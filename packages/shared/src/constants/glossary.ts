export interface GlossaryEntry {
  term: string;
  aka?: string;
  definition: string;
}

/**
 * Glosario canónico consumido por web (HelpHint popovers) y mobile
 * (glossary-modal). Es la fuente única de verdad de la terminología
 * del producto. Mantener:
 * - **Un término por concepto**. Si hay alias comercial o coloquial,
 *   va en `aka`.
 * - **Tono conversacional** orientado al dueño de casa promedio
 *   (persona Carlos/Norma). Evitar jerga de ingeniería civil salvo
 *   cuando es el término oficial que el usuario se va a cruzar.
 * - **Sincronizar con enum-labels.ts**. Si el nombre oficial de un
 *   estado cambia ahí, actualizar acá también.
 */
export const GLOSSARY: readonly GlossaryEntry[] = [
  // ─── ISV y estado de la vivienda ─────────────────────────
  {
    term: 'ISV',
    aka: 'Puntaje de Salud',
    definition:
      'Número de 0 a 100 que mide cuánto cuidado necesita tu casa. Se calcula combinando tareas al día, condición promedio, cobertura de sectores inspeccionados, y relación entre mantenimiento preventivo y correctivo. Arriba de 60 significa que está bien mantenida; debajo indica que las reparaciones futuras van a ser más caras.',
  },
  {
    term: 'Niveles de ISV',
    aka: 'Excelente, Bueno, Regular, Crítico',
    definition:
      'Cómo interpretar el puntaje: 80-100 Excelente (pocos ajustes pendientes), 60-79 Bueno (mantenimiento al día), 40-59 Regular (hay atención pendiente), 0-39 Crítico (requiere intervención pronta). El color de cada tarjeta refleja el tier.',
  },
  {
    term: 'Plan de mantenimiento',
    definition:
      'La lista de tareas programadas para cuidar tu casa, con fechas y prioridades. Lo genera la arquitecta después de la inspección inicial y se reajusta con los hallazgos.',
  },

  // ─── Tareas ──────────────────────────────────────────────
  {
    term: 'Estado de tarea',
    definition:
      'Dónde está cada tarea de tu plan: Próxima (todavía no es momento), Pendiente (ya toca hacerla), Vencida (pasó la fecha) o Completada (registrada con o sin foto).',
  },
  {
    term: 'Prioridad de tarea',
    aka: 'Urgente / Alta / Media / Baja',
    definition:
      'Cuán pronto conviene atender: Urgente (hay riesgo de daño mayor si se posterga), Alta (requiere atención pronto), Media (recomendada pero flexible), Baja (estética o confort).',
  },
  {
    term: 'Tarea cíclica',
    definition:
      'Una tarea que se repite automáticamente. Al completarla, se reprograma para la próxima fecha según su recurrencia. Por eso siempre vas a tener tareas pendientes — es el ciclo normal del mantenimiento preventivo.',
  },
  {
    term: 'Recurrencia',
    aka: 'Frecuencia',
    definition:
      'Cada cuánto se repite una tarea: mensual, trimestral, semestral, anual o "al detectar" (sólo si aparece un hallazgo). Las tareas se reprograman al completarlas.',
  },
  {
    term: 'Categoría',
    aka: 'Tipo de trabajo',
    definition:
      'Agrupa las tareas por área: plomería, electricidad, estructura, pintura, impermeabilización, etc.',
  },
  {
    term: 'Requisito profesional',
    aka: 'Profesional recomendado',
    definition:
      'Indica si una tarea la podés hacer vos o si conviene / es obligatorio un especialista. Tres niveles: "Propietario puede" (con herramientas básicas), "Profesional recomendado" (se puede hacer solo pero conviene un técnico), "Profesional obligatorio" (requiere matrícula por seguridad o legalidad).',
  },

  // ─── Diagnóstico y condición ─────────────────────────────
  {
    term: 'Condición',
    aka: 'Estado encontrado',
    definition:
      'Cómo se encontró algo al hacer una inspección: Excelente (como nuevo), Bueno (funcional), Aceptable (observaciones), Deteriorado (conviene intervenir), Crítico (requiere atención inmediata).',
  },
  {
    term: 'Resultado de inspección',
    definition:
      'Qué se concluye al completar una tarea: OK (todo bien), OK con observaciones (bien, pero anotá algo), Requiere atención (falta algo menor), Requiere reparación (intervenir pronto), Reparación urgente (ya).',
  },
  {
    term: 'Acción tomada',
    definition:
      'Qué hiciste al registrar la tarea: sólo inspección visual, limpieza, reparación menor, reparación mayor. Sirve para separar lo preventivo (visual/limpieza) de lo correctivo (reparar).',
  },
  {
    term: 'Hallazgo',
    aka: 'Problema detectado',
    definition:
      'Cuando una inspección marca condición Deteriorado o Crítico, la plataforma lo cuenta como hallazgo. Aparece en el listado del informe y puede disparar la creación de una solicitud de servicio.',
  },
  {
    term: 'Sector',
    aka: 'Zona de la casa',
    definition:
      'Cada área de tu vivienda: techo, paredes exteriores, pisos, instalaciones eléctricas, plomería, etc. El ISV cubre sector por sector para que ninguno quede olvidado.',
  },
  {
    term: 'Índice de riesgo',
    aka: 'Urgencia',
    definition:
      'Número que indica qué tan urgente es resolver una tarea. Más alto = atender primero. Los problemas estructurales (techo, cimientos) puntúan más alto porque escalan rápido.',
  },

  // ─── Solicitudes y presupuestos ──────────────────────────
  {
    term: 'Solicitud de servicio',
    definition:
      'Pedido para que EPDE ejecute una tarea de mantenimiento por vos. Puede ser algo del plan que necesita profesional, algo que preferís que lo hagamos nosotros, o un problema nuevo. Ejemplo: "Necesito que revisen la instalación eléctrica."',
  },
  {
    term: 'Urgencia de solicitud',
    definition:
      'Qué tan rápido necesitás que se resuelva tu pedido: Urgente (hoy o mañana), Alta (esta semana), Media (este mes), Baja (cuando se pueda). Distinta de la prioridad de las tareas del plan.',
  },
  {
    term: 'Presupuesto',
    aka: 'Cotización',
    definition:
      'Cotización para un trabajo de arquitectura que NO es mantenimiento: ampliación, renovación, plano municipal, habilitación, relevamiento. Ejemplo: "Quiero ampliar la cocina, ¿cuánto sale?"',
  },

  // ─── Portfolio y multi-propiedad ─────────────────────────
  {
    term: 'Portfolio',
    aka: 'Mis propiedades',
    definition:
      'Vista comparativa que se activa cuando tenés 2 o más propiedades en EPDE. Muestra lado a lado el estado (ISV, tareas vencidas, pendientes) de cada una para decidir cuál atender primero sin entrar a cada propiedad.',
  },

  // ─── Certificaciones y documentos ────────────────────────
  {
    term: 'Certificado de Mantenimiento Preventivo',
    aka: 'Certificado EPDE',
    definition:
      'Documento privado informativo que deja constancia de las tareas de mantenimiento ejecutadas sobre una vivienda, emitido bajo dirección profesional de la arquitecta responsable de EPDE. Requiere un ISV mínimo de 60 puntos y al menos 1 año de antigüedad del plan. Útil como historial documentado al mostrar la vivienda a compradores o inmobiliarias. No reemplaza certificados oficiales exigidos por bancos, aseguradoras o escribanías.',
  },
  {
    term: 'Inspección técnica',
    aka: 'Informe técnico firmado',
    definition:
      'Servicio pagado aparte del plan en el que la arquitecta responsable de EPDE ejecuta personalmente un relevamiento firmado (no se deriva a terceros). Tres tipos: básica, estructural profunda y para compraventa. Exclusivo para clientes activos con 15% de descuento sobre el precio público.',
  },
  {
    term: 'Oblea NAG-226',
    aka: 'Oblea de gas',
    definition:
      'Certificado de seguridad de la instalación de gas firmado por gasista matriculado ENARGAS. Exigido por distribuidoras de gas (ECOGAS, Metrogas, etc.) ante cambios de titularidad o instalación nueva. NO está incluido en la inspección técnica de EPDE — requiere otro matriculado habilitado.',
  },
  {
    term: 'Informe RE-7',
    aka: 'Informe técnico eléctrico',
    definition:
      'Declaración de seguridad de la instalación eléctrica firmada por electricista matriculado con habilitación del Colegio provincial. Exigido en compraventas y algunas habilitaciones municipales. NO está incluido en la inspección técnica de EPDE.',
  },

  // ─── Profesionales y red EPDE ────────────────────────────
  {
    term: 'Profesional matriculado',
    aka: 'Red EPDE',
    definition:
      'Técnico certificado y registrado en un órgano profesional (COPIME, CPIC, Colegio de Arquitectos, ENARGAS, etc.) al que EPDE deriva tareas que requieren habilitación. Los profesionales de la red EPDE tienen matrícula y seguro de responsabilidad civil verificados.',
  },
  {
    term: 'Gasista matriculado',
    aka: 'ENARGAS',
    definition:
      'Único profesional habilitado legalmente en Argentina para trabajar con instalaciones de gas natural o GLP. Requiere matrícula ENARGAS. Es una matrícula distinta a la de plomero — muchos son ambos, pero no todos.',
  },
  {
    term: 'Maestro Mayor de Obras',
    aka: 'MMO',
    definition:
      'Matriculado habilitado para ejecutar y dirigir obras menores, firmar planos municipales, y hacer reparaciones estructurales básicas. Equivalente operativo del arquitecto para mantenimiento.',
  },

  // ─── Suscripción y acceso ────────────────────────────────
  {
    term: 'Suscripción',
    aka: 'Acceso a la plataforma',
    definition:
      'Tu acceso a EPDE tiene una fecha de vencimiento. Mientras esté activa, podés ver el plan, completar tareas, recibir recordatorios y solicitar servicios. Cuando se acerca el vencimiento aparece un aviso en el panel; si venció, se bloquea el acceso hasta renovar por WhatsApp.',
  },
] as const;
