import { useMutation } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';

import { useUploadFile } from '../use-upload';

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@epde/shared', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback) };
});

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}));

describe('useUploadFile', () => {
  const mockMutationReturn = { mutate: vi.fn(), mutateAsync: vi.fn() };

  beforeEach(() => {
    vi.mocked(useMutation).mockReturnValue(mockMutationReturn as ReturnType<typeof useMutation>);
  });

  afterEach(() => vi.clearAllMocks());

  it('should call useMutation', () => {
    renderHook(() => useUploadFile());
    expect(useMutation).toHaveBeenCalledWith(
      expect.objectContaining({ mutationFn: expect.any(Function) }),
    );
  });

  it('should show success toast on success', () => {
    renderHook(() => useUploadFile());
    const { onSuccess } = vi.mocked(useMutation).mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(toast.success).toHaveBeenCalledWith('Archivo subido');
  });

  it('should show error toast on error', () => {
    renderHook(() => useUploadFile());
    const { onError } = vi.mocked(useMutation).mock.calls[0][0] as {
      onError: (err: Error) => void;
    };
    onError(new Error('fail'));
    expect(toast.error).toHaveBeenCalledWith('Error al subir archivo');
  });
});
