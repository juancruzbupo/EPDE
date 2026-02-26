import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EmptyState } from '../empty-state';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Sin datos" message="No hay elementos" />);
    expect(screen.getByText('Sin datos')).toBeTruthy();
  });

  it('renders message', () => {
    render(<EmptyState title="Sin datos" message="No hay elementos para mostrar" />);
    expect(screen.getByText('No hay elementos para mostrar')).toBeTruthy();
  });

  it('renders both title and message together', () => {
    render(<EmptyState title="Vacio" message="Intente mas tarde" />);
    expect(screen.getByText('Vacio')).toBeTruthy();
    expect(screen.getByText('Intente mas tarde')).toBeTruthy();
  });
});
