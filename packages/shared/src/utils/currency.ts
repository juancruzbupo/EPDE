const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const formatterCompact = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export function formatARS(value: number | string): string {
  return formatter.format(Number(value));
}

/** Format as ARS without decimals — for dashboard charts and stat cards. */
export function formatARSCompact(value: number | string): string {
  return formatterCompact.format(Number(value));
}
