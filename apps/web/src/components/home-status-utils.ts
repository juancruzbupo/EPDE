export interface ScoreTheme {
  title: string;
  bg: string;
  border: string;
  barColor: string;
  textColor: string;
}

export function getScoreTheme(score: number): ScoreTheme {
  if (score >= 80)
    return {
      title: 'Tu casa está bien',
      bg: 'bg-success/5',
      border: 'border-success/20',
      barColor: 'var(--success)',
      textColor: 'text-success',
    };
  if (score >= 60)
    return {
      title: 'Tu casa necesita algo de atención',
      bg: 'bg-warning/5',
      border: 'border-warning/20',
      barColor: 'var(--warning)',
      textColor: 'text-warning',
    };
  if (score >= 40)
    return {
      title: 'Tu casa necesita atención',
      bg: 'bg-caution/5',
      border: 'border-caution/20',
      barColor: 'var(--caution)',
      textColor: 'text-caution',
    };
  return {
    title: 'Tu casa necesita atención urgente',
    bg: 'bg-destructive/5',
    border: 'border-destructive/20',
    barColor: 'var(--destructive)',
    textColor: 'text-destructive',
  };
}

export function getScoreConsequence(score: number): string | null {
  if (score >= 80) return null;
  if (score >= 60)
    return 'Mantené el ritmo de inspecciones para evitar que los costos de reparación aumenten.';
  if (score >= 40)
    return 'Un ISV por debajo de 60 indica que los problemas se están acumulando. Las reparaciones correctivas suelen costar entre 8x y 15x más que la prevención.';
  return 'Tu vivienda necesita intervención urgente. Cada mes de demora aumenta significativamente el costo de las reparaciones.';
}

export function getHumanMessage(overdue: number, urgent: number, upcoming: number): string {
  if (overdue > 0 && urgent > 0)
    return `Tenés ${overdue} tarea${overdue !== 1 ? 's' : ''} vencida${overdue !== 1 ? 's' : ''} y ${urgent} urgente${urgent !== 1 ? 's' : ''}. Revisalas cuanto antes.`;
  if (overdue > 0)
    return `Tenés ${overdue} tarea${overdue !== 1 ? 's' : ''} vencida${overdue !== 1 ? 's' : ''}. Revisalas para mantener tu casa al día.`;
  if (urgent > 0)
    return `Tenés ${urgent} tarea${urgent !== 1 ? 's' : ''} urgente${urgent !== 1 ? 's' : ''}. Completá${urgent !== 1 ? 'las' : 'la'} esta semana.`;
  if (upcoming > 0)
    return `Tenés ${upcoming} tarea${upcoming !== 1 ? 's' : ''} programada${upcoming !== 1 ? 's' : ''} esta semana.`;
  return 'Todo bajo control. Seguí así y tu hogar se va a mantener en excelente estado.';
}
