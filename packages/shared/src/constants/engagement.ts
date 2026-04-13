// ─── Dopamine / Engagement ──────────────────────────────

/** Motivational messages shown after completing a task (rotated randomly). */
export const COMPLETION_MESSAGES = [
  'Tu casa está un poco más segura.',
  'Bien hecho. Seguí cuidando tu hogar.',
  'Tarea al día. Tu ISV te lo agradece.',
  'Un paso más para mantener tu casa en forma.',
  'Prevención hecha. Tu patrimonio te lo agradece.',
] as const;

/** Estimated savings by category when a problem is detected early.
 * Used for "Evitaste un problema" dopamine feedback. */
export const PREVENTION_SAVINGS: Record<string, string> = {
  Estructura: '$500.000 – $3.000.000',
  'Techos y Cubiertas': '$150.000 – $400.000',
  'Instalación Eléctrica': '$80.000 – $180.000',
  'Instalación Sanitaria': '$100.000 – $300.000',
  'Gas y Calefacción': '$200.000 – $500.000',
  Aberturas: '$50.000 – $150.000',
  'Pintura y Revestimientos': '$80.000 – $250.000',
  'Jardín y Exteriores': '$100.000 – $300.000',
  Climatización: '$60.000 – $200.000',
  'Humedad e Impermeabilización': '$300.000 – $800.000',
  'Seguridad contra Incendio': '$100.000 – $500.000',
  'Control de Plagas': '$80.000 – $200.000',
  'Pisos y Contrapisos': '$100.000 – $400.000',
};

/** Daily home maintenance tips — rotated by day of year. */
export const DAILY_TIPS = [
  '¿Sabías que limpiar los filtros del AC cada 3 meses reduce el consumo eléctrico hasta un 15%?',
  'Revisá las canillas de tu casa cada 6 meses. Un goteo constante puede desperdiciar 30 litros por día.',
  'Las canaletas obstruidas son la causa #1 de humedad en paredes. Limpialas cada 3 meses.',
  'Probá el disyuntor diferencial una vez al mes: presioná el botón de test. Si no corta, llamá a un electricista.',
  'Las juntas de silicona en baños y cocinas duran 2-3 años. Revisalas y renovalas para evitar filtraciones.',
  'Los detectores de humo necesitan baterías nuevas al menos una vez al año. ¿Cuándo cambiaste las tuyas?',
  'La humedad ascendente en muros suele ser invisible al principio. Revisá la base de tus paredes periódicamente.',
  'Un control de gas anual puede prevenir intoxicaciones por monóxido de carbono. Es obligatorio según la NAG-226.',
  'Lubricar bisagras y cerraduras 2 veces al año prolonga su vida útil y evita trabas molestas.',
  'Las termitas pueden dañar una estructura de madera durante años sin que lo notes. Revisá marcos y zócalos.',
  'El ánodo de sacrificio del termotanque se consume con el tiempo. Verificalo una vez al año para evitar corrosión.',
  'Una llave de paso de agua que no gira puede ser un problema grave en una emergencia. Probala cada 6 meses.',
  'Los burletes de puertas y ventanas se desgastan. Renovarlos mejora la aislación y reduce el gasto en climatización.',
  'Después de una tormenta fuerte, recorré la casa buscando filtraciones. Detectar temprano ahorra reparaciones costosas.',
  'Las manchas blancas en paredes (eflorescencias) indican presencia de humedad. No las ignores.',
  'Podar árboles cercanos al techo previene daños por ramas caídas durante tormentas.',
  'La presión de agua baja puede indicar una pérdida oculta. Cerrá todas las canillas y fijate si el medidor se mueve.',
  'Los mosquitos se reproducen en agua estancada. Revisá platos de macetas, canaletas y baldes cada semana.',
  'Un matafuego vencido es tan inútil como no tener uno. Verificá la fecha de recarga anualmente.',
  'La membrana asfáltica del techo dura 10-15 años. Si tiene más, es hora de evaluarla.',
  'Ventilá tu casa 15 minutos al día, incluso en invierno. Reduce la humedad y previene hongos.',
  'Las persianas de enrollar necesitan mantenimiento anual: limpiar guías y lubricar el eje.',
  'La pintura exterior protege el revoque. Si está descascarada, el agua penetra y genera humedad.',
  'Revisá las mangueras de la conexión del lavarropas. Se endurecen con el tiempo y pueden reventarse.',
  'Una instalación eléctrica de más de 20 años necesita una revisión profesional completa.',
  'Los pisos de madera necesitan plastificado cada 3-5 años para mantener su protección.',
  'El conducto de la chimenea del calefón debe estar libre de obstrucciones. Es cuestión de seguridad.',
  'Revisá que las rejas y portones estén bien fijados y sin oxidación en las bases empotradas.',
  'Limpiá la parrilla después de cada uso y revisá los ladrillos refractarios 2 veces al año.',
  'Si tenés pileta, el pH del agua debe estar entre 7.2 y 7.6 para evitar daños en el revestimiento.',
] as const;
