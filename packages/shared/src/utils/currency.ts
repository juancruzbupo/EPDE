const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

export function formatARS(value: number | string): string {
  return formatter.format(Number(value));
}
