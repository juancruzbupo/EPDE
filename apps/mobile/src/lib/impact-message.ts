/**
 * Returns a user-facing impact message for a detected problem based on sector and severity.
 * Used in the property detail screen to explain potential consequences.
 */
export function getMobileImpactMessage(
  sector: string | null,
  severity: 'high' | 'medium' = 'medium',
): string {
  const critical = severity === 'high';
  switch (sector) {
    case 'ROOF':
      return critical
        ? 'Puede generar filtraciones activas y dañar interiores.'
        : 'Puede convertirse en filtraciones con el tiempo.';
    case 'BATHROOM':
    case 'KITCHEN':
      return critical
        ? 'Puede provocar humedad constante y afectar otros ambientes.'
        : 'Puede generar humedad y desgaste progresivo.';
    case 'INSTALLATIONS':
      return critical
        ? 'Puede comprometer la seguridad de la instalación.'
        : 'Puede volverse un problema más serio con el tiempo.';
    case 'BASEMENT':
      return critical
        ? 'Puede afectar la estabilidad de la estructura.'
        : 'Puede generar daños estructurales si no se controla.';
    case 'EXTERIOR':
    case 'GARDEN':
    case 'TERRACE':
      return critical
        ? 'Puede generar acumulación de agua y daños mayores.'
        : 'Puede empeorar con el clima.';
    default:
      return critical
        ? 'Puede empeorar rápidamente y generar daños mayores.'
        : 'Puede evolucionar y volverse más costoso de reparar.';
  }
}
