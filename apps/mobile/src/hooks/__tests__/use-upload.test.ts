import { useMutation } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useUploadFile } from '../use-upload';

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));

jest.mock('@/lib/api/upload', () => ({
  uploadFile: jest.fn(),
}));

const mockMutationReturn = { mutate: jest.fn(), mutateAsync: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock).mockReturnValue(mockMutationReturn);
});

describe('useUploadFile', () => {
  it('should call useMutation', () => {
    renderHook(() => useUploadFile());
    expect(useMutation).toHaveBeenCalledWith(
      expect.objectContaining({ mutationFn: expect.any(Function) }),
    );
  });

  it('should show success alert on success', () => {
    renderHook(() => useUploadFile());
    const { onSuccess } = (useMutation as jest.Mock).mock.calls[0][0];
    onSuccess();
    expect(Alert.alert).toHaveBeenCalledWith('Éxito', 'Archivo subido');
  });

  it('should show error alert on error', () => {
    renderHook(() => useUploadFile());
    const { onError } = (useMutation as jest.Mock).mock.calls[0][0];
    onError(new Error('fail'));
    expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
  });
});
