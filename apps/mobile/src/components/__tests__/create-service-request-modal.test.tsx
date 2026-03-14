import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/lib/animations', () => ({
  useSlideIn: () => ({}),
}));

jest.mock('@/lib/haptics', () => ({
  haptics: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/hooks/use-service-requests', () => ({
  useCreateServiceRequest: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/hooks/use-upload', () => ({
  useUploadFile: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/hooks/use-plans', () => ({
  useAllTasks: () => ({ data: [] }),
}));

jest.mock('@/hooks/use-properties', () => ({
  useProperties: () => ({
    data: {
      pages: [
        {
          data: [{ id: 'prop-1', address: 'Av. Libertador 1234', city: 'CABA' }],
        },
      ],
    },
  }),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

import { CreateServiceRequestModal } from '../create-service-request-modal';

describe('CreateServiceRequestModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with header', () => {
    render(<CreateServiceRequestModal {...defaultProps} />);
    expect(screen.getByText('Nueva Solicitud')).toBeTruthy();
  });

  it('renders property selector with available properties', () => {
    render(<CreateServiceRequestModal {...defaultProps} />);
    expect(screen.getByText('Propiedad')).toBeTruthy();
    expect(screen.getByText('Av. Libertador 1234')).toBeTruthy();
  });

  it('renders urgency options', () => {
    render(<CreateServiceRequestModal {...defaultProps} />);
    expect(screen.getByText('Urgencia')).toBeTruthy();
    expect(screen.getByText('Baja')).toBeTruthy();
    expect(screen.getByText('Media')).toBeTruthy();
    expect(screen.getByText('Alta')).toBeTruthy();
    expect(screen.getByText('Urgente')).toBeTruthy();
  });

  it('renders form fields and photo section', () => {
    render(<CreateServiceRequestModal {...defaultProps} />);
    expect(screen.getByText('Titulo')).toBeTruthy();
    expect(screen.getByText('Descripcion')).toBeTruthy();
    expect(screen.getByText('Fotos (opcional, max 5)')).toBeTruthy();
  });

  it('calls onClose when cancel is pressed and form is clean', () => {
    render(<CreateServiceRequestModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
