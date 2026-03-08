import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatCard } from '../stat-card';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Pendientes" value={12} />);
    expect(screen.getByText('Pendientes')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('applies default variant styling (text-foreground)', () => {
    render(<StatCard title="Total" value={5} />);
    const valueText = screen.getByText('5');
    expect(valueText.props.className).toContain('text-foreground');
  });

  it('applies destructive variant styling (text-destructive)', () => {
    render(<StatCard title="Vencidas" value={3} variant="destructive" />);
    const valueText = screen.getByText('3');
    expect(valueText.props.className).toContain('text-destructive');
  });

  it('formats value as a number', () => {
    render(<StatCard title="Tareas" value={0} />);
    expect(screen.getByText('0')).toBeTruthy();
  });
});
