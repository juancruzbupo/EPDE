import React from 'react';
import { render, screen } from '@testing-library/react-native';
import {
  StatusBadge,
  TaskStatusBadge,
  BudgetStatusBadge,
  ServiceStatusBadge,
  PriorityBadge,
} from '../status-badge';

describe('StatusBadge', () => {
  it('renders the label text', () => {
    render(<StatusBadge label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<StatusBadge label="Default" variant="default" />);
    expect(screen.getByText('Default')).toBeTruthy();

    rerender(<StatusBadge label="Success" variant="success" />);
    expect(screen.getByText('Success')).toBeTruthy();

    rerender(<StatusBadge label="Destructive" variant="destructive" />);
    expect(screen.getByText('Destructive')).toBeTruthy();
  });
});

describe('TaskStatusBadge', () => {
  it('renders Spanish label for PENDING', () => {
    render(<TaskStatusBadge status="PENDING" />);
    expect(screen.getByText('Pendiente')).toBeTruthy();
  });

  it('renders Spanish label for COMPLETED', () => {
    render(<TaskStatusBadge status="COMPLETED" />);
    expect(screen.getByText('Completada')).toBeTruthy();
  });

  it('falls back to raw status for unknown values', () => {
    render(<TaskStatusBadge status="UNKNOWN" />);
    expect(screen.getByText('UNKNOWN')).toBeTruthy();
  });
});

describe('BudgetStatusBadge', () => {
  it('renders Spanish label for APPROVED', () => {
    render(<BudgetStatusBadge status="APPROVED" />);
    expect(screen.getByText('Aprobado')).toBeTruthy();
  });

  it('renders Spanish label for REJECTED', () => {
    render(<BudgetStatusBadge status="REJECTED" />);
    expect(screen.getByText('Rechazado')).toBeTruthy();
  });
});

describe('ServiceStatusBadge', () => {
  it('renders Spanish label for OPEN', () => {
    render(<ServiceStatusBadge status="OPEN" />);
    expect(screen.getByText('Abierto')).toBeTruthy();
  });

  it('renders Spanish label for RESOLVED', () => {
    render(<ServiceStatusBadge status="RESOLVED" />);
    expect(screen.getByText('Resuelto')).toBeTruthy();
  });
});

describe('PriorityBadge', () => {
  it('renders Spanish label for URGENT', () => {
    render(<PriorityBadge priority="URGENT" />);
    expect(screen.getByText('Urgente')).toBeTruthy();
  });
});
