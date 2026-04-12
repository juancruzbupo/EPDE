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
      'Pedís un precio para una reparación específica que ya sabés que necesitás. Ejemplo: "Las canaletas están rotas, ¿cuánto sale repararlas?"',
  },
  {
    term: 'Solicitud de servicio',
    definition:
      'Reportás un problema para que EPDE lo evalúe y te diga qué hacer. Ejemplo: "Hay humedad en la pared, no sé qué es."',
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
    term: 'Categoría',
    aka: 'Tipo de trabajo',
    definition:
      'Agrupa las tareas por área: plomería, electricidad, estructura, pintura, impermeabilización, etc.',
  },
] as const;
