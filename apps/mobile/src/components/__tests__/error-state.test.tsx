import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ErrorState } from '../error-state';

describe('ErrorState', () => {
  it('renders "Error al cargar" title', () => {
    render(<ErrorState />);
    expect(screen.getByText('Error al cargar')).toBeTruthy();
  });

  it('renders default message when no message prop is provided', () => {
    render(<ErrorState />);
    expect(screen.getByText('No se pudieron cargar los datos. Intentá de nuevo.')).toBeTruthy();
  });

  it('renders custom message', () => {
    render(<ErrorState message="Algo salió mal" />);
    expect(screen.getByText('Algo salió mal')).toBeTruthy();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    const button = screen.getByText('Reintentar');
    expect(button).toBeTruthy();

    fireEvent.press(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByText('Reintentar')).toBeNull();
  });
});
