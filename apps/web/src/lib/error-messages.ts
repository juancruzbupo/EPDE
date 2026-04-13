export const ERROR_MESSAGES = {
  network: 'Sin conexión. Verificá tu internet.',
  generic: 'Algo salió mal. Reintentá en unos segundos.',
  load: (entity: string) => `No pudimos cargar ${entity}.`,
  create: (entity: string) => `No pudimos crear ${entity}.`,
  update: (entity: string) => `No pudimos actualizar ${entity}.`,
  delete: (entity: string) => `No pudimos eliminar ${entity}.`,
} as const;
