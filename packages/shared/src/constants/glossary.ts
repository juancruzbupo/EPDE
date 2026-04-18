export interface GlossaryEntry {
  term: string;
  aka?: string;
  definition: string;
}

export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    term: 'ISV',
    aka: 'Puntaje de Salud',
    definition:
      'Número de 0 a 100 que mide cuánto cuidado necesita tu casa. Arriba de 60 significa que está bien mantenida. Debajo de 60 indica que las reparaciones futuras van a ser más caras.',
  },
  {
    term: 'Plan de mantenimiento',
    definition:
      'La lista de tareas programadas para cuidar tu casa, con fechas y prioridades. Lo genera la arquitecta después de la inspección.',
  },
  {
    term: 'Sector',
    aka: 'Zona de la casa',
    definition:
      'Cada área de tu vivienda: techo, paredes exteriores, pisos, instalaciones eléctricas, plomería, etc.',
  },
  {
    term: 'Índice de riesgo',
    aka: 'Urgencia',
    definition:
      'Número que indica qué tan urgente es resolver una tarea. Más alto = atender primero. Los problemas estructurales (techo, cimientos) puntúan más alto porque escalan rápido.',
  },
  {
    term: 'Presupuesto',
    aka: 'Cotización',
    definition:
      'Cotización para un trabajo de arquitectura que no es mantenimiento: ampliación, renovación, plano municipal, habilitación, relevamiento. Ejemplo: "Quiero ampliar la cocina, ¿cuánto sale?"',
  },
  {
    term: 'Solicitud de servicio',
    definition:
      'Pedí que EPDE ejecute una tarea de mantenimiento por vos. Puede ser algo del plan que necesita profesional, algo que preferís que lo hagamos nosotros, o un problema nuevo. Ejemplo: "Necesito que revisen la instalación eléctrica."',
  },
  {
    term: 'Hallazgo',
    aka: 'Problema detectado',
    definition:
      'Lo que la arquitecta encontró durante la inspección de tu vivienda. Puede ser algo que necesita atención o requiere un profesional.',
  },
  {
    term: 'Recurrencia',
    aka: 'Frecuencia',
    definition:
      'Cada cuánto tiempo se repite una tarea: mensual, trimestral, semestral o anual. Las tareas se reprograman automáticamente al completarlas.',
  },
  {
    term: 'Tarea cíclica',
    definition:
      'Una tarea que se repite automáticamente. Al completarla, se reprograma para la próxima fecha según su recurrencia. Por eso siempre vas a tener tareas pendientes — es normal.',
  },
  {
    term: 'Condición',
    definition:
      'El estado en que encontrás algo al hacer una inspección: Excelente, Bueno, Aceptable, Malo o Crítico.',
  },
  {
    term: 'Profesional requerido',
    definition:
      'Indica si una tarea la podés hacer vos o si necesitás contratar a un especialista (plomero, electricista, etc.).',
  },
  {
    term: 'Profesional matriculado',
    aka: 'Especialista certificado',
    definition:
      'Un técnico certificado y registrado en su área (electricista, plomero, gasista). Lo necesitás para trabajos que requieren garantía de seguridad, como instalar una línea eléctrica nueva o habilitar gas.',
  },
  {
    term: 'Estado de tarea',
    definition:
      'Dónde está cada tarea de tu plan: Próxima (todavía no es momento), Pendiente (ya toca hacerla), Vencida (pasó la fecha) o Completada (registrada con o sin foto).',
  },
  {
    term: 'Categoría',
    aka: 'Tipo de trabajo',
    definition:
      'Agrupa las tareas por área: plomería, electricidad, estructura, pintura, impermeabilización, etc.',
  },
  {
    term: 'Certificado de Mantenimiento Preventivo',
    aka: 'Certificado EPDE',
    definition:
      'Documento privado informativo que deja constancia de las tareas de mantenimiento ejecutadas sobre una vivienda, emitido bajo dirección profesional de la arquitecta responsable de EPDE. Requiere un ISV mínimo de 60 puntos y al menos 1 año de antigüedad del plan. Útil como historial documentado al mostrar la vivienda a compradores o inmobiliarias. No reemplaza certificados oficiales exigidos por bancos, aseguradoras o escribanías.',
  },
  {
    term: 'Profesional matriculado',
    aka: 'Especialista EPDE',
    definition:
      'Técnico certificado y registrado en un órgano profesional (COPIME, CPIC, etc.) al que EPDE deriva tareas de mantenimiento que requieren habilitación (electricistas, plomeros, arquitectos). Los profesionales de la red EPDE tienen matrícula y seguro RC verificados.',
  },
  {
    term: 'Tier de profesional',
    definition:
      'Escala interna de confianza del admin sobre un profesional: A (usar siempre), B (aceptable), C (último recurso), Bloqueado (no volver a contratar). No visible para el cliente.',
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
  {
    term: 'Inspección técnica',
    aka: 'Informe técnico firmado',
    definition:
      'Servicio pagado aparte del plan en el que la arquitecta responsable de EPDE ejecuta personalmente un relevamiento firmado (no se deriva a terceros). Tres tipos: básica, estructural profunda y para compraventa. Exclusivo para clientes activos con 15% de descuento sobre el precio público. Ver ADR-019.',
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
] as const;
